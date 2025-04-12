const { ApifyClient } = require('apify-client');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');
const fetch = require('node-fetch');

const INSTAGRAM_USERNAME = 'umabrisacriativa';
const APIFY_TOKEN = 'apify_api_2wnEcDXU2ttOx79nkYYj3EbH9ELdfT2XI5H4';

// Inicializa o cliente Apify
const client = new ApifyClient({
    token: APIFY_TOKEN,
});

function generateFileName(caption) {
    if (!caption) return 'sem_descricao';
    
    // Remove emojis e caracteres especiais
    let cleanCaption = caption.replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
        .replace(/[^\w\s]/g, '')
        .trim();
    
    // Pega as primeiras palavras até 90 caracteres
    let words = cleanCaption.split(/\s+/);
    let fileName = '';
    
    for (let word of words) {
        if (fileName.length + word.length + 1 <= 90) {
            fileName += (fileName ? '_' : '') + word;
        } else {
            break;
        }
    }
    
    return fileName.toLowerCase() || 'sem_descricao';
}

async function downloadMedia(url, filePath) {
    try {
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        await fs.outputFile(filePath, Buffer.from(buffer));
        return true;
    } catch (error) {
        console.error(`Erro ao baixar mídia: ${error.message}`);
        return false;
    }
}

async function processPost(post, baseDir) {
    const postDate = moment(post.timestamp);
    const monthDir = path.join(baseDir, postDate.format('YYYY-MM'));
    
    // Cria diretório do mês se não existir
    await fs.ensureDir(monthDir);
    
    const fileNameBase = generateFileName(post.caption);
    const postData = {
        id: post.id,
        timestamp: post.timestamp,
        caption: post.caption,
        hashtags: post.hashtags,
        location: post.locationName,
        likes: post.likesCount,
        comments: post.commentsCount,
        media: []
    };

    // Processa vídeos
    if (post.videoUrl) {
        const extension = '.mp4';
        const fileName = `${fileNameBase}${extension}`;
        const filePath = path.join(monthDir, fileName);
        
        const success = await downloadMedia(post.videoUrl, filePath);
        if (success) {
            postData.media.push({
                type: 'video',
                fileName: fileName,
                duration: post.videoDuration,
                views: post.videoViewCount
            });
        }
    }

    // Processa imagens
    if (post.images && post.images.length > 0) {
        for (let i = 0; i < post.images.length; i++) {
            const mediaUrl = post.images[i];
            const extension = '.jpg';
            const fileName = `${fileNameBase}_${i}${extension}`;
            const filePath = path.join(monthDir, fileName);
            
            const success = await downloadMedia(mediaUrl, filePath);
            if (success) {
                postData.media.push({
                    type: 'image',
                    fileName: fileName
                });
            }
        }
    }

    // Se não tiver imagens no array images, tenta usar displayUrl
    if (postData.media.length === 0 && post.displayUrl) {
        const extension = '.jpg';
        const fileName = `${fileNameBase}${extension}`;
        const filePath = path.join(monthDir, fileName);
        
        const success = await downloadMedia(post.displayUrl, filePath);
        if (success) {
            postData.media.push({
                type: 'image',
                fileName: fileName
            });
        }
    }

    // Salva metadados
    const metadataPath = path.join(monthDir, `${fileNameBase}.json`);
    await fs.writeJson(metadataPath, postData, { spaces: 2 });
}

async function crawlYear(year) {
    const baseDir = path.join(__dirname, 'downloads');
    await fs.ensureDir(baseDir);

    // Prepara o input do Actor
    const input = {
        "directUrls": [`https://www.instagram.com/${INSTAGRAM_USERNAME}/`],
        "resultsType": "posts",
        "resultsLimit": 100,
        "searchType": "hashtag",
        "searchLimit": 1,
        "addParentData": false
    };

    try {
        // Executa o Actor e aguarda o término
        console.log(`Iniciando o crawling para o ano ${year}...`);
        const run = await client.actor("shu8hvrXbJbY3Eb9W").call(input);
        
        // Busca os resultados do dataset
        console.log('Buscando resultados...');
        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        
        // Filtra apenas os posts do ano especificado
        const posts = items.filter(item => 
            (item.type === 'Video' || item.type === 'Image' || item.type === 'Sidecar') &&
            moment(item.timestamp).year() === year
        );
        
        // Ordena posts do mais recente para o mais antigo
        posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        console.log(`Encontrados ${posts.length} posts para ${year}. Iniciando download...`);

        // Processa posts com delay para evitar bloqueio
        for (const post of posts) {
            console.log(`Processando post ${post.id}...`);
            console.log(`Data: ${moment(post.timestamp).format('DD/MM/YYYY')}`);
            console.log(`Legenda: ${post.caption ? post.caption.substring(0, 100) + '...' : 'Sem legenda'}`);
            await processPost(post, baseDir);
            // Delay de 2-5 segundos entre cada post
            const delay = Math.random() * 3000 + 2000;
            console.log(`Aguardando ${Math.round(delay/1000)} segundos...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        console.log(`Crawling para ${year} concluído!`);
    } catch (error) {
        console.error(`Erro durante o crawling de ${year}:`, error);
        console.error('Stack:', error.stack);
    }
}

async function main() {
    // Executa o crawling para cada ano
    await crawlYear(2025);
    await crawlYear(2024);
    await crawlYear(2023);
}

main().catch(console.error); 
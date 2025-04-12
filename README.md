# Instagram Crawler - Umabrisa Criativa

Este projeto é um crawler para o Instagram que baixa todas as imagens e vídeos do perfil @umabrisacriativa, organizando-os por mês e salvando os metadados em arquivos JSON.

## Estrutura do Projeto

- `downloads/`: Diretório onde os arquivos serão salvos
  - `YYYY-MM/`: Pastas organizadas por mês
    - `[post_id]_[index].jpg`: Imagens
    - `[post_id]_[index].mp4`: Vídeos
    - `[post_id].json`: Metadados do post

## Requisitos

- Node.js 14+
- Conta no Apify (https://apify.com)

## Configuração

1. Instale as dependências:
```bash
npm install
```

2. Configure sua chave de API do Apify:
```bash
export APIFY_TOKEN="seu_token_aqui"
```

## Uso

Execute o crawler:
```bash
npm start
```

O crawler irá:
1. Baixar todas as postagens do perfil @umabrisacriativa
2. Organizar os arquivos por mês
3. Salvar imagens e vídeos com seus respectivos metadados
4. Incluir delays aleatórios entre 2-5 segundos para evitar bloqueio

## Estrutura dos Metadados

Cada post é salvo em um arquivo JSON com a seguinte estrutura:
```json
{
  "id": "post_id",
  "timestamp": "data_do_post",
  "caption": "legenda_do_post",
  "media": [
    {
      "type": "image|video",
      "fileName": "nome_do_arquivo"
    }
  ]
}
``` 
import os
import json
import shutil
from pathlib import Path
import re

def clean_text(text):
    """Remove emojis e caracteres especiais do texto."""
    if not text:
        return ""
    # Remove emojis
    emoji_pattern = re.compile("["
        u"\U0001F600-\U0001F64F"  # emoticons
        u"\U0001F300-\U0001F5FF"  # symbols & pictographs
        u"\U0001F680-\U0001F6FF"  # transport & map symbols
        u"\U0001F1E0-\U0001F1FF"  # flags (iOS)
        u"\U00002702-\U000027B0"
        u"\U000024C2-\U0001F251"
        "]+", flags=re.UNICODE)
    text = emoji_pattern.sub(r'', text)
    # Remove caracteres especiais
    text = re.sub(r'[^\w\s]', ' ', text)
    return text.strip()

def determine_category(metadata):
    """Determina a categoria baseado nos metadados."""
    caption = clean_text(metadata.get('caption', '')).lower()
    hashtags = [tag.lower() for tag in metadata.get('hashtags', [])]
    
    # Categorias principais
    categories = {
        "Quarto Infantil": ["quarto", "infantil", "bebê", "criança", "kids", "nursery"],
        "Quarto Adulto": ["quarto", "adulto", "master", "principal"],
        "Empresas": ["empresa", "corporativo", "escritório", "comercial", "loja"],
        "Salas": ["sala", "estar", "jantar", "tv", "living"],
        "Outros": []
    }
    
    # Subcategorias
    subcategories = {
        "Quarto Infantil": {
            "Safari": ["safari", "animais", "selva", "zoo"],
            "Espaço": ["espaço", "universo", "planetas", "astronauta"],
            "Fantasia": ["fantasia", "mágico", "unicórnio", "fada"],
            "Princesas": ["princesa", "castelo", "realeza"],
            "Praia": ["praia", "mar", "oceano", "concha"],
            "Abstrato": ["abstrato", "colorido", "arte"]
        },
        "Quarto Adulto": {
            "Abstrato": ["abstrato", "arte", "moderno"],
            "Geométrico": ["geométrico", "formas", "padrões"],
            "Natureza": ["natureza", "paisagem", "floresta"],
            "Minimalista": ["minimalista", "simples", "clean"]
        },
        "Empresas": {
            "Corporativo": ["corporativo", "profissional", "negócios"],
            "Criativo": ["criativo", "inovação", "design"],
            "Educacional": ["educação", "escola", "universidade"]
        },
        "Salas": {
            "Sala de Estar": ["estar", "tv", "living"],
            "Sala de Jantar": ["jantar", "jantar"],
            "Home Office": ["escritório", "trabalho", "home office"]
        },
        "Outros": {
            "Geral": []
        }
    }
    
    # Determina categoria principal
    main_category = "Outros"
    max_matches = 0
    
    for category, keywords in categories.items():
        matches = sum(1 for keyword in keywords if keyword in caption or any(keyword in tag for tag in hashtags))
        if matches > max_matches:
            max_matches = matches
            main_category = category
    
    # Determina subcategoria
    subcategory = "Geral"
    max_sub_matches = 0
    
    for sub, keywords in subcategories[main_category].items():
        matches = sum(1 for keyword in keywords if keyword in caption or any(keyword in tag for tag in hashtags))
        if matches > max_sub_matches:
            max_sub_matches = matches
            subcategory = sub
    
    return main_category, subcategory

def organize_portfolio():
    """Organiza o portfólio em categorias e subcategorias."""
    portfolio_dir = Path("portfolio")
    organized_dir = Path("organized_portfolio")
    
    # Cria diretório organizado
    organized_dir.mkdir(exist_ok=True)
    
    # Processa cada arquivo JSON
    for json_file in portfolio_dir.rglob("*.json"):
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                metadata = json.load(f)
            
            # Determina categoria e subcategoria
            categoria, subcategoria = determine_category(metadata)
            
            # Cria diretórios
            category_dir = organized_dir / categoria / subcategoria
            category_dir.mkdir(parents=True, exist_ok=True)
            
            # Copia arquivos
            base_name = json_file.stem
            for ext in ['.json', '.jpg', '.mp4']:
                src_file = json_file.parent / f"{base_name}{ext}"
                if src_file.exists():
                    dest_file = category_dir / f"{base_name}{ext}"
                    shutil.copy2(src_file, dest_file)
            
            # Atualiza metadados
            metadata.update({
                "categoria": categoria,
                "subcategoria": subcategoria
            })
            
            with open(category_dir / f"{base_name}.json", 'w', encoding='utf-8') as f:
                json.dump(metadata, f, ensure_ascii=False, indent=2)
                
        except Exception as e:
            print(f"Erro ao processar {json_file}: {e}")

if __name__ == "__main__":
    organize_portfolio() 
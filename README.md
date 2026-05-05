# Cubinhos 3D — Construtor Voxel para Minecraft Education

Cubinhos 3D é uma aplicação estática para alunos do 1.º ciclo planearem construções em blocos reais do Minecraft e exportarem um ficheiro `.mcstructure`.

## Como usar

1. Abre `index.html` ou publica este repositório no GitHub Pages.
2. Escolhe um bloco na paleta.
3. Constrói por camadas ou muda para o **modo isométrico assistido** para construir numa vista mais parecida com Minecraft Education.
4. Usa rotação e zoom para ver à volta; o mapa de camadas ajuda a não perder a altura atual.
5. Guarda no browser ou descarrega o projeto JSON para continuar depois.
6. Clica em **Exportar .mcstructure**.

## Importar no Minecraft Education / Bedrock

A documentação Microsoft Learn para Structure Blocks indica que a importação de `.mcstructure` através do botão **Import** é limitada à versão Windows do jogo. Em Minecraft Education, o Structure Block exige permissões de World Builder/anfitrião.

Fluxo recomendado:

1. Abre um mundo criativo suportado no Minecraft Education/Bedrock para Windows.
2. Obtém um Structure Block com `/give @s structure_block`.
3. Coloca o bloco e muda para modo **Load**.
4. Usa **Import** para escolher o ficheiro `.mcstructure` exportado.
5. Confirma a caixa de limites e clica em **Load**.

## Escopo da primeira versão

Incluído:
- site estático compatível com GitHub Pages;
- grelha 32×32×32;
- paleta infantil de blocos reais;
- colocar, apagar, preencher camada, desfazer/refazer;
- modo isométrico assistido por camada com rotação, zoom e mapa de orientação;
- guardar/abrir localmente;
- exportar `.mcstructure` sem entidades.

Fora de escopo:
- multiplayer;
- contas, servidor ou base de dados;
- inventário completo do Minecraft;
- entidades, redstone, baús, comandos ou mobs;
- editor 3D profissional.

## Desenvolvimento

```bash
npm test
npm start
```

Depois abre `http://localhost:8000`.

## Fontes técnicas

- Bedrock Wiki `.mcstructure`: https://wiki.bedrock.dev/nbt/mcstructure
- Microsoft Learn Structure Blocks: https://learn.microsoft.com/en-us/minecraft/creator/documents/structures/introductiontostructureblocks?view=minecraft-bedrock-stable
- Minecraft Education Specialty Blocks: https://edusupport.minecraft.net/hc/en-us/articles/360047116852-Specialty-Blocks-Allow-Deny-Border-Structure

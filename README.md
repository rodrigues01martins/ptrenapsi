# PT FAMI — Auditoria de Despesas do Plano de Trabalho

Aplicativo de monitoramento e auditoria da execução financeira de um Plano de Trabalho, construído reaproveitando a arquitetura do sistema de controle financeiro da SEDS (React + TypeScript + Vite + Tailwind + Firebase).

## Arquitetura

- **Frontend**: React 19 + TypeScript, Vite, Tailwind CSS v4
- **Backend**: Firebase Authentication (e-mail/senha) + Cloud Firestore
- **Gráficos**: Chart.js via react-chartjs-2

## Funcionalidades

- **Login institucional** com persistência de sessão por aba/navegador
- **Itens do Plano de Trabalho** (etapa, grupo, categoria, valor previsto) cadastrados e editados pelo administrador — não são mais fixos no código
- **Lançamento de despesas** vinculadas a um item do plano, com anexo de PDF (Nota Fiscal/comprovante)
- **Fluxo de aprovação** (Em análise → Pendente/Aprovado/Desaprovado), restrito a administradores
- **Dashboard**: cards de resumo, gráficos de execução por categoria/grupo/etapa/mês, tabela de lançamentos com filtros, análise de saldo por item (com destaque de itens críticos)
- **Exportação CSV** dos lançamentos
- **Gestão de usuários**: administrador concede/revoga acesso a cada aba (Incluir Registros, Ambiente do Relatório, Relatório Final) e papel (admin/usuário)
- **Relatório Final de Execução do Objeto**: assistente em 12 seções que gera um relatório para impressão/PDF; os dados fixos da parceria (instrumento jurídico, OSC, objeto, valores previstos por grupo de despesa etc.) são configurados pelo administrador na primeira seção, ao invés de fixos no código

## Papéis e permissões

- **Administrador**: definido pelo campo `role: "admin"` no documento `/users/{uid}` no Firestore (editável na aba "Gestão de Usuários"). Um e-mail de bootstrap (`BOOTSTRAP_ADMIN_EMAIL` em `src/firebase.ts`, replicado em `firestore.rules`) garante acesso de administrador ao primeiro usuário, antes de qualquer papel ser atribuído.
- **Usuário comum**: acesso liberado individualmente pelo administrador a cada seção (`canAccessEntry`, `canAccessReport`, `canAccessRelatorio`).

## Configuração

**Prerequisites:** Node.js

1. Instale as dependências:
   `npm install`
2. Crie um projeto no [Firebase Console](https://console.firebase.google.com/), ative **Authentication** (e-mail/senha) e **Cloud Firestore**.
3. Copie as credenciais do projeto para `src/firebase.ts` (substitua os valores `SUBSTITUA_...`).
4. Publique as regras de segurança em `firestore.rules` no seu projeto Firebase.
5. Ajuste `BOOTSTRAP_ADMIN_EMAIL` em `src/firebase.ts` e em `firestore.rules` para o e-mail que deve ser administrador antes de qualquer papel ser atribuído.
6. Rode o app:
   `npm run dev`
7. Faça login com o e-mail de bootstrap, acesse "Itens do Plano" e cadastre os itens orçamentários do Plano de Trabalho auditado.

## Estrutura de dados (Firestore)

Ver `firebase-blueprint.json` para o schema completo das coleções `users`, `budgetItems`, `ledger`, `audit` e `settings/partnership`.

# 🏷️ DimensionaPro
**Plataforma web profissional para dimensionamento — rápida, precisa e acessível de qualquer lugar.**

---

## 📌 Resumo Executivo

O setor que depende de cálculos de dimensionamento enfrenta um problema recorrente: ferramentas dispersas, planilhas manuais e processos sujeitos a erros humanos. O **DimensionaPro** foi construído para resolver isso — uma aplicação web full-stack que centraliza e automatiza o processo de dimensionamento de forma profissional. Com frontend moderno em JavaScript, backend dedicado, banco de dados gerenciado via **Supabase** e deploy contínuo na **Vercel**, o projeto entrega uma experiência fluida e escalável. A plataforma está disponível em produção em [dimensiona-pro.vercel.app](https://dimensiona-pro.vercel.app).

---

## 🎯 Descrição do Problema

### Por que este projeto existe?

Profissionais que precisam realizar cálculos de dimensionamento frequentemente recorrem a métodos manuais, planilhas desorganizadas ou ferramentas genéricas que não atendem às especificidades do domínio. Isso gera lentidão, retrabalho e falta de rastreabilidade dos dados calculados.

O **DimensionaPro** surge como solução centralizada, oferecendo uma interface profissional para realizar, armazenar e gerenciar dimensionamentos de forma eficiente.

### Perguntas que o projeto responde

1. Como automatizar e padronizar o processo de dimensionamento?
2. Como persistir e recuperar históricos de cálculos realizados?
3. Como oferecer uma experiência de uso profissional e acessível via web?
4. Como garantir escalabilidade e disponibilidade com infraestrutura moderna?

---

## 🔄 Metodologia

### Tipo de projeto

Aplicação Web Full-Stack · SaaS / Ferramenta Profissional

### Etapas do projeto

**1. Levantamento de Requisitos**
Identificação das necessidades de usuários que realizam dimensionamentos, mapeamento dos fluxos principais e definição do escopo MVP.

**2. Modelagem do Banco de Dados**
Estruturação das tabelas e relações no **Supabase** (PostgreSQL), com configuração de autenticação e políticas de acesso (RLS).

**3. Desenvolvimento do Backend**
Criação da camada de servidor em JavaScript responsável pela lógica de negócio, integração com o banco e exposição de APIs para o frontend.

**4. Desenvolvimento do Frontend**
Interface web responsiva construída em JavaScript/CSS, com foco em usabilidade e clareza nos fluxos de entrada de dados e visualização de resultados.

**5. Deploy e Entrega Contínua**
Configuração de pipeline de deploy automatizado via **Vercel**, conectado ao repositório GitHub para entregas contínuas a cada push na branch `main`.

---

## 🛠️ Habilidades Técnicas Utilizadas

| Ferramenta / Skill | Aplicação no Projeto |
|---|---|
| **JavaScript** | Linguagem principal do frontend e backend (97.8% do código) |
| **CSS** | Estilização e responsividade da interface |
| **Supabase** | Banco de dados PostgreSQL gerenciado, autenticação e armazenamento |
| **Node.js / Backend JS** | Lógica de servidor, regras de negócio e APIs REST |
| **Vercel** | Plataforma de deploy com CI/CD integrado ao GitHub |
| **Git / GitHub** | Controle de versão e colaboração |
| **Supabase RLS** | Controle de acesso e segurança dos dados por usuário |

---

## 📈 Principais Funcionalidades e Diferenciais

1. **Dimensionamento automatizado** — cálculos realizados de forma rápida e padronizada, eliminando erros manuais.
2. **Persistência de dados** — histórico de dimensionamentos armazenado no banco, acessível a qualquer momento.
3. **Autenticação integrada** — sistema de login via Supabase Auth, garantindo segurança e isolamento de dados por usuário.
4. **Interface profissional** — UI limpa e focada na produtividade do usuário.
5. **Disponibilidade total** — aplicação 100% web, sem necessidade de instalação, acessível de qualquer dispositivo.

---

## 🗂️ Estrutura do Projeto

```
DimensionaPro/
├── frontend/        # Interface web do usuário
├── backend/         # Servidor e lógica de negócio
├── supabase/        # Configurações e migrations do banco de dados
├── docs/
│   └── superpowers/ # Documentação de funcionalidades avançadas
└── .gitignore
```

---

## 🔗 Contato

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/seu-perfil)
[![E-mail](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:seu@email.com)

---

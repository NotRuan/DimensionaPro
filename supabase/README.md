# Supabase Setup

## 1. Create Project
- Go to supabase.com → New Project
- Name: dimensionapro
- Region: South America (São Paulo)
- Note down your password

## 2. Run Migrations
In Supabase SQL Editor, run these files in order:
1. `001_initial_schema.sql` — Creates all 5 tables and indexes
2. `002_buscar_volumetria_function.sql` — Creates the 6-month volumetry function

## 3. Create ADM user
Generate bcrypt hash in terminal:
```
node -e "const b=require('bcryptjs');b.hash('YourPassword',10).then(h=>console.log(h))"
```

Then in SQL Editor:
```sql
INSERT INTO usuarios (nome, email, senha_hash, perfil)
VALUES ('Administrador', 'admin@mapfre.com', '$2a$10$YOUR_HASH', 'ADM');
```

## 4. Get credentials
In Project Settings → API:
- Project URL → SUPABASE_URL and VITE_SUPABASE_URL
- anon/public key → VITE_SUPABASE_PUBLISHABLE_KEY  
- service_role key → SUPABASE_SECRET_KEY (backend only, never frontend)

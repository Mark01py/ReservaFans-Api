# ReservaFans — API

API REST em Node.js + Express (padrão MVC) para gestão e agendamento de salas,
auditórios e equipamentos da FANS. Modelo de estoque, **sem etapa de aprovação**.

## Como rodar

```bash
npm install
cp .env.example .env
npm run seed     # recria o banco com dados iniciais (apaga o banco atual!)
npm start        # http://localhost:3000
```

Credenciais do seed: `admin@fans.edu.br / admin123` e `daniel.lelis@fans.edu.br / professor123`.

> Se você já tinha rodado a versão anterior, rode `npm install` (nova dependência: multer)
> e `npm run seed` de novo — a estrutura do banco mudou (categorias agora são uma tabela).

## Novidades desta versão

- **Horário de aula (18:50–22:25):** toda reserva precisa estar dentro desse
  horário e no mesmo dia (`src/utils/horarioAula.js`). O cálculo usa o horário
  de Brasília (UTC-3 fixo), independente do fuso do servidor.
- **Reserva por período:** `POST /api/reservas/periodo` com `{ resourceId, dataInicio, dataFim }`
  (datas `YYYY-MM-DD`) cria uma reserva por dia, sempre 18:50–22:25. Só confirma se
  **todos** os dias tiverem estoque; senão não cria nenhuma e informa os dias sem estoque.
- **Upload de imagem:** `POST/PUT /api/recursos` aceitam `multipart/form-data` com o
  campo `foto` (JPG/PNG/WEBP/GIF até 5 MB). Arquivos ficam em `uploads/` e são servidos em `/uploads/...`.
- **Categorias cadastráveis:** `GET /api/categorias` (logado) e `POST /api/categorias`
  (admin). Recursos usam `categoriaId` e retornam `categoriaRef: { id, nome }`.

## Endpoints

| Método | Rota | Acesso |
|---|---|---|
| POST | /api/auth/login, /api/auth/registrar | público |
| GET | /api/auth/perfil | logado |
| GET | /api/categorias | logado |
| POST | /api/categorias | admin |
| GET | /api/recursos, /api/recursos/:id, /api/recursos/:id/disponibilidade | logado |
| POST / PUT / DELETE | /api/recursos | admin |
| POST | /api/reservas, /api/reservas/periodo | logado |
| GET | /api/reservas/minhas | logado |
| PATCH | /api/reservas/:id/cancelar | logado |
| GET | /api/reservas | admin |
| PATCH | /api/reservas/:id/marcar-em-uso, /devolucao | admin |
| GET | /api/relatorios/resumo, /mais-solicitados | admin |

## Dados de demonstração

`npm run seed:demo` recria o banco com 10 recursos em 4 categorias, 5 usuários e reservas de exemplo
(histórico, itens em uso, uma devolução atrasada, reservas futuras e uma reserva por período), todas
relativas à data de hoje. Contas: `admin@fans.edu.br / admin123` e `aluno.teste@fans.edu.br / teste123`.

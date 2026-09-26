# Backend / Banco de dados — Guia do Estilo

A base comercial do Guia do Estilo usa Supabase Auth + PostgreSQL + Row Level Security (RLS) + Storage.

## O que esta camada resolve
- Cada cadastro recebe um auth.users.id exclusivo.
- Cada usuário possui seu próprio perfil, coleção e histórico.
- As linhas de dados ficam vinculadas a user_id.
- RLS impede que um usuário leia ou altere dados de outro.
- Planos comerciais ficam separados dos dados pessoais.
- Assinaturas ficam preparadas para Stripe ou Mercado Pago.
- Fotos de análise de estilo ficam em bucket privado, separadas do banco relacional.
- Histórico de análise de estilo, curadoria de compra e consumo de IA podem ser contabilizados por usuário.

## Migration

Arquivo: supabase/migrations/20260926_001_multi_tenant_foundation.sql

### Como aplicar agora
1. Abra o projeto do Guia do Estilo no Supabase.
2. Vá em SQL Editor.
3. Abra o arquivo da migration no GitHub.
4. Cole o conteúdo inteiro no SQL Editor.
5. Execute uma única vez.
6. Em Authentication → Providers, habilite pelo menos Email.
7. Confirme em Table Editor que as tabelas novas existem.
8. Confirme em Storage que o bucket privado gde-style-photos existe.

A migration não apaga as tabelas legadas gde_perfumes e gde_watches. Isso é proposital para não perder os dados atuais antes de o novo login ser conectado.

## Modelo comercial
| Camada | Responsabilidade |
|---|---|
| Supabase Auth | cadastro, login, sessão e identidade |
| gde_profiles | perfil, idioma, moeda, papel e plano |
| gde_plans | limites e recursos dos planos |
| gde_subscriptions | assinatura e status de cobrança |
| gde_user_perfumes | coleção individual |
| gde_user_watches | acessórios individualizados |
| gde_style_analyses | histórico da análise de estilo |
| gde_purchase_searches | histórico de curadoria de compra |
| gde_ai_usage | consumo por usuário/dia |
| Storage | fotos privadas de análise |

## Planos iniciais
- Free: 20 fragrâncias, 3 análises de estilo/mês, 3 curadorias de compra/mês.
- Plus: 250 fragrâncias, 30 análises, 30 curadorias.
- Pro: 2.000 fragrâncias, 200 análises, 200 curadorias.
- Admin: uso interno.

Esses limites são configuração inicial e ainda não devem ser considerados cobrança ativa. O enforcement de limites será colocado no backend/Edge Functions antes do lançamento comercial.

## Próxima etapa obrigatória
A interface atual ainda usa armazenamento local e a tabela legada. O próximo passo é conectar:

Cadastro → Login → sessão → perfil → coleção do usuário → RLS → sincronização

Depois:

Free → checkout → assinatura → webhook → atualização de plano → limites de IA

As chaves secretas de Stripe, Mercado Pago, provedores de IA e qualquer service_role nunca devem entrar no index.html ou no GitHub. Elas devem ficar em funções/backend protegidos.

## Migração dos dados existentes
Os dados locais atuais serão tratados como dados do primeiro usuário somente depois que ele fizer login.

Fluxo planejado:

localStorage → autenticação → user_id → gde_user_perfumes → validação → backup

Nenhuma limpeza do armazenamento local deve ser feita antes dessa migração.
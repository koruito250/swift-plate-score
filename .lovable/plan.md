# Acesso simples ao administrador geral CorpMind

## Resultado desejado
Entrar com **corpmind@gmail.com** e a senha simples já solicitada, sem alterar os painéis dos restaurantes nem apagar os clientes existentes.

## Já concluído e testado
- Administrador geral mostra os quatro clientes existentes, ativos, bloqueados, vencidos e o valor total de todas as assinaturas.
- Cadastro, edição, bloqueio, desbloqueio, exclusão e login de um cliente de teste funcionaram; o cadastro de teste foi removido.
- Garçons agora pertencem somente ao restaurante correto; cadastro, edição e exclusão foram verificados.
- O QR gerado da Mesa 07 foi decodificado e abriu a ficha pública com mesa preenchida e o garçom correto.
- O e-mail do master já foi atualizado; a senha solicitada **ainda não foi aplicada** porque a proteção de senhas fracas a recusou.

## O que executar
1. **Simplificar a tela de entrada:** acesso claramente separado entre “Cliente” e “Administrador geral”, e-mail do master preenchido e opção de mostrar/ocultar a senha. Nunca preencher ou mostrar automaticamente a senha.
2. **Permitir a senha solicitada:** desativar somente a verificação de senhas vazadas/fracas, sem mudar outras configurações de cadastro ou confirmação de e-mail. Essa redução de proteção permite senhas muito fáceis de adivinhar e afeta as futuras definições de senha dos clientes também.
3. **Aplicar a senha à conta master existente:** preservar o mesmo usuário, suas permissões e todos os clientes. Não criar um segundo administrador nem adicionar uma senha fixa ao código.
4. **Testar a entrada real:** entrar com o e-mail e a senha solicitados, confirmar a abertura do painel master e verificar que um cliente comum não ganha acesso à gestão geral.

## Dependência para a senha simples
As ferramentas disponíveis não fornecem uma leitura completa das configurações atuais de autenticação. Para não sobrescrever outras configurações, o proprietário precisa abrir **Mais → Usuários → Configurações de autenticação → E-mail** e desativar somente **Password HIBP Check**. Após esse ajuste, aplicar a senha solicitada e testar o login.

## Detalhes técnicos
- Manter Lovable Cloud Auth, validação de permissões no servidor e isolamento por restaurante.
- Não reintroduzir a função pública que redefinia automaticamente a senha master ao abrir a página.
- Usar os controles e cores existentes; modificar somente as telas de entrada relacionadas ao pedido.
- Publicar apenas quando solicitado; as mudanças de tela precisam de publicação para chegar ao site público.

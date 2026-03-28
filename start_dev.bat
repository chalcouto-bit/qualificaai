@echo off
echo Iniciando QualificaAI em modo de desenvolvimento...

start cmd /k "cd backend && npm run dev"
start cmd /k "cd frontend && npm run dev"

echo Portas:
echo Backend: 3001
echo Frontend: 5175
echo.
echo Pressione qualquer tecla para fechar esta janela (os servidores continuarao rodando)...
pause

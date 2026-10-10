import { useEffect } from "react";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import { translationSupplement } from "@/lib/translationSupplement";

type Translation = Partial<Record<Exclude<Language, "pt-BR">, string>>;

const translations: Record<string, Translation> = {
  "Carregando...": { "en-US": "Loading...", "es-ES": "Cargando..." },
  "Sair": { "en-US": "Sign out", "es-ES": "Cerrar sesión" },
  "Todos os direitos reservados": { "en-US": "All rights reserved", "es-ES": "Todos los derechos reservados" },
  "Acesse sua conta para acompanhar seu veículo": { "en-US": "Access your account to follow your vehicle", "es-ES": "Accede a tu cuenta para seguir tu vehículo" },
  "Email": { "en-US": "Email", "es-ES": "Correo electrónico" },
  "Senha": { "en-US": "Password", "es-ES": "Contraseña" },
  "Esqueci minha senha": { "en-US": "I forgot my password", "es-ES": "Olvidé mi contraseña" },
  "Não tem conta?": { "en-US": "Don't have an account?", "es-ES": "¿No tienes una cuenta?" },
  "Cadastre-se": { "en-US": "Create an account", "es-ES": "Regístrate" },
  "Entrar": { "en-US": "Sign in", "es-ES": "Iniciar sesión" },
  "Criar Conta": { "en-US": "Create account", "es-ES": "Crear cuenta" },
  "Cadastre-se para acompanhar seu veículo": { "en-US": "Create an account to follow your vehicle", "es-ES": "Regístrate para seguir tu vehículo" },
  "Nome": { "en-US": "Name", "es-ES": "Nombre" },
  "Telefone": { "en-US": "Phone", "es-ES": "Teléfono" },
  "Confirmar Senha": { "en-US": "Confirm password", "es-ES": "Confirmar contraseña" },
  "Já tem conta?": { "en-US": "Already have an account?", "es-ES": "¿Ya tienes una cuenta?" },
  "Dashboard": { "en-US": "Dashboard", "es-ES": "Panel" },
  "Veículos": { "en-US": "Vehicles", "es-ES": "Vehículos" },
  "Financiamento": { "en-US": "Financing", "es-ES": "Financiación" },
  "Agendamentos": { "en-US": "Appointments", "es-ES": "Citas" },
  "Perfil": { "en-US": "Profile", "es-ES": "Perfil" },
  "Toyota Shop": { "en-US": "Toyota Shop", "es-ES": "Tienda Toyota" },
  "Carregando dashboard...": { "en-US": "Loading dashboard...", "es-ES": "Cargando panel..." },
  "Ver veículo": { "en-US": "View vehicle", "es-ES": "Ver vehículo" },
  "Ver financiamento": { "en-US": "View financing", "es-ES": "Ver financiación" },
  "Central de avisos": { "en-US": "Notifications", "es-ES": "Centro de avisos" },
  "Ações rápidas": { "en-US": "Quick actions", "es-ES": "Acciones rápidas" },
  "Dados Pessoais": { "en-US": "Personal information", "es-ES": "Datos personales" },
  "Segurança da Conta": { "en-US": "Account security", "es-ES": "Seguridad de la cuenta" },
  "Editar Perfil": { "en-US": "Edit profile", "es-ES": "Editar perfil" },
  "Alterar senha": { "en-US": "Change password", "es-ES": "Cambiar contraseña" },
  "Senha de acesso": { "en-US": "Access password", "es-ES": "Contraseña de acceso" },
  "Compras Toyota Shop": { "en-US": "Toyota Shop purchases", "es-ES": "Compras de Tienda Toyota" },
  "Ir para Toyota Shop": { "en-US": "Go to Toyota Shop", "es-ES": "Ir a Tienda Toyota" },
  "Carregando financiamento...": { "en-US": "Loading financing...", "es-ES": "Cargando financiación..." },
  "Pagamento simulado": { "en-US": "Simulated payment", "es-ES": "Pago simulado" },
  "Próxima parcela": { "en-US": "Next installment", "es-ES": "Próxima cuota" },
  "Pagamento da parcela": { "en-US": "Installment payment", "es-ES": "Pago de cuota" },
  "Cartão de crédito": { "en-US": "Credit card", "es-ES": "Tarjeta de crédito" },
  "Boleto": { "en-US": "Bank slip", "es-ES": "Boleto" },
  "Novo agendamento": { "en-US": "New appointment", "es-ES": "Nueva cita" },
  "Excluir agendamento": { "en-US": "Delete appointment", "es-ES": "Eliminar cita" },
  "Horário": { "en-US": "Time", "es-ES": "Horario" },
  "Cliente": { "en-US": "Customer", "es-ES": "Cliente" },
  "Tipo": { "en-US": "Type", "es-ES": "Tipo" },
  "Observação": { "en-US": "Notes", "es-ES": "Observación" },
  "Revisão": { "en-US": "Service", "es-ES": "Revisión" },
  "Retirada": { "en-US": "Pickup", "es-ES": "Retiro" },
  "Outros": { "en-US": "Other", "es-ES": "Otros" },
  "Carrinho": { "en-US": "Cart", "es-ES": "Carrito" },
  "Carrinho de compras": { "en-US": "Shopping cart", "es-ES": "Carrito de compras" },
  "Subtotal": { "en-US": "Subtotal", "es-ES": "Subtotal" },
  "Desconto": { "en-US": "Discount", "es-ES": "Descuento" },
  "Total": { "en-US": "Total", "es-ES": "Total" },
  "Forma de pagamento": { "en-US": "Payment method", "es-ES": "Método de pago" },
  "Cartão de débito": { "en-US": "Debit card", "es-ES": "Tarjeta de débito" },
  "Novo veículo": { "en-US": "New vehicle", "es-ES": "Nuevo vehículo" },
  "Marca": { "en-US": "Brand", "es-ES": "Marca" },
  "Modelo": { "en-US": "Model", "es-ES": "Modelo" },
  "Ano": { "en-US": "Year", "es-ES": "Año" },
  "Motor": { "en-US": "Engine", "es-ES": "Motor" },
  "Cor": { "en-US": "Color", "es-ES": "Color" },
  "Câmbio": { "en-US": "Transmission", "es-ES": "Transmisión" },
  "Combustível": { "en-US": "Fuel", "es-ES": "Combustible" },
  "Chassi": { "en-US": "Chassis", "es-ES": "Chasis" },
  "Próxima revisão": { "en-US": "Next service", "es-ES": "Próxima revisión" },
  "Timeline de Fabricação": { "en-US": "Manufacturing timeline", "es-ES": "Cronología de fabricación" },
  "Progresso": { "en-US": "Progress", "es-ES": "Progreso" },
  "Acessibilidade": { "en-US": "Accessibility", "es-ES": "Accesibilidad" },
  "Conectividade": { "en-US": "Connectivity", "es-ES": "Conectividad" },
  "Experiência": { "en-US": "Experience", "es-ES": "Experiencia" },
  "Explorar agora": { "en-US": "Explore now", "es-ES": "Explorar ahora" },
  "Digite sua mensagem...": { "en-US": "Type your message...", "es-ES": "Escribe tu mensaje..." },
  "seu@email.com": { "en-US": "your@email.com", "es-ES": "tu@correo.com" },
  "Seu nome": { "en-US": "Your name", "es-ES": "Tu nombre" },
  "Nome do cliente": { "en-US": "Customer name", "es-ES": "Nombre del cliente" },
  "Selecione o tipo": { "en-US": "Select a type", "es-ES": "Selecciona un tipo" },
  "Selecione uma forma de pagamento": { "en-US": "Select a payment method", "es-ES": "Selecciona un método de pago" },
  "Veículo": { "en-US": "Vehicle", "es-ES": "Vehículo" },
  "Agendamento": { "en-US": "Appointments", "es-ES": "Citas" },
  "Olá,": { "en-US": "Hello,", "es-ES": "Hola," },
  "Bem-vindo ao seu portal Toyota ACE.": { "en-US": "Welcome to your Toyota ACE portal.", "es-ES": "Te damos la bienvenida a tu portal Toyota ACE." },
  "Veículo principal": { "en-US": "Main vehicle", "es-ES": "Vehículo principal" },
  "Nenhum veículo vinculado": { "en-US": "No vehicle linked", "es-ES": "Ningún vehículo vinculado" },
  "Ano não informado": { "en-US": "Year not provided", "es-ES": "Año no informado" },
  "Cor não informada": { "en-US": "Color not provided", "es-ES": "Color no informado" },
  "Quando um veículo for atribuído, ele aparecerá aqui.": { "en-US": "When a vehicle is assigned, it will appear here.", "es-ES": "Cuando se asigne un vehículo, aparecerá aquí." },
  "Escolher veículo principal": { "en-US": "Choose main vehicle", "es-ES": "Elegir vehículo principal" },
  "Etapa atual": { "en-US": "Current step", "es-ES": "Etapa actual" },
  "Pronto para retirada": { "en-US": "Ready for pickup", "es-ES": "Listo para recoger" },
  "Concessionária": { "en-US": "Dealership", "es-ES": "Concesionario" },
  "Transporte": { "en-US": "In transit", "es-ES": "En transporte" },
  "Inspeção": { "en-US": "Inspection", "es-ES": "Inspección" },
  "Linha de produção": { "en-US": "Production line", "es-ES": "Línea de producción" },
  "Pedido realizado": { "en-US": "Order placed", "es-ES": "Pedido realizado" },
  "Aguardando atualização": { "en-US": "Awaiting update", "es-ES": "Esperando actualización" },
  "veículo(s) vinculado(s)": { "en-US": "linked vehicle(s)", "es-ES": "vehículo(s) vinculado(s)" },
  "Não informada": { "en-US": "Not provided", "es-ES": "No informada" },
  "mantenha sua garantia ativa": { "en-US": "keep your warranty active", "es-ES": "mantén activa tu garantía" },
  "Acessórios": { "en-US": "Accessories", "es-ES": "Accesorios" },
  "produtos exclusivos Toyota": { "en-US": "exclusive Toyota products", "es-ES": "productos exclusivos Toyota" },
  "Acompanhamento do veículo": { "en-US": "Vehicle tracking", "es-ES": "Seguimiento del vehículo" },
  "Nenhum veículo vinculado ao seu cadastro.": { "en-US": "No vehicle is linked to your account.", "es-ES": "No hay ningún vehículo vinculado a tu cuenta." },
  "Nenhum financiamento pendente informado.": { "en-US": "No pending financing was reported.", "es-ES": "No se informó ningún financiamiento pendiente." },
  "Garantia": { "en-US": "Warranty", "es-ES": "Garantía" },
  "Status de garantia não informado.": { "en-US": "Warranty status not provided.", "es-ES": "Estado de garantía no informado." },
  "Agendar serviço": { "en-US": "Schedule service", "es-ES": "Agendar servicio" },
  "Pagar parcela": { "en-US": "Pay installment", "es-ES": "Pagar cuota" },
  "Ver timeline": { "en-US": "View timeline", "es-ES": "Ver cronología" },
  "Comprar acessórios": { "en-US": "Shop accessories", "es-ES": "Comprar accesorios" },
  "Meus Veículos": { "en-US": "My Vehicles", "es-ES": "Mis vehículos" },
  "Selecione um veículo para acompanhar ficha técnica e fabricação.": { "en-US": "Select a vehicle to track its specifications and production.", "es-ES": "Selecciona un vehículo para consultar sus especificaciones y fabricación." },
  "Carregando veículos...": { "en-US": "Loading vehicles...", "es-ES": "Cargando vehículos..." },
  "Não foi possível carregar os veículos.": { "en-US": "Could not load vehicles.", "es-ES": "No se pudieron cargar los vehículos." },
  "Nenhum veículo vinculado ao seu cadastro ainda.": { "en-US": "No vehicle is linked to your account yet.", "es-ES": "Todavía no hay ningún vehículo vinculado a tu cuenta." },
  "Veículo sem modelo": { "en-US": "Vehicle model unavailable", "es-ES": "Modelo del vehículo no disponible" },
  "Aguardando status": { "en-US": "Awaiting status", "es-ES": "Esperando estado" },
  "Não informado": { "en-US": "Not provided", "es-ES": "No informado" },
  "Cegonha": { "en-US": "Vehicle carrier", "es-ES": "Transporte" },
  "Seu pedido foi registrado no sistema da concessionária.": { "en-US": "Your order has been registered with the dealership.", "es-ES": "Tu pedido se registró en el sistema del concesionario." },
  "O veículo entrou na linha de produção da fábrica.": { "en-US": "The vehicle has entered the factory production line.", "es-ES": "El vehículo entró en la línea de producción de la fábrica." },
  "São realizados testes de qualidade e segurança.": { "en-US": "Quality and safety tests are being performed.", "es-ES": "Se realizan pruebas de calidad y seguridad." },
  "O veículo está em transporte para a concessionária.": { "en-US": "The vehicle is being transported to the dealership.", "es-ES": "El vehículo está en camino al concesionario." },
  "O veículo chegou à concessionária e está em preparação.": { "en-US": "The vehicle has arrived at the dealership and is being prepared.", "es-ES": "El vehículo llegó al concesionario y está en preparación." },
  "Seu veículo está pronto para ser retirado.": { "en-US": "Your vehicle is ready for pickup.", "es-ES": "Tu vehículo está listo para recoger." },
  " de ": { "en-US": " of ", "es-ES": " de " },
  " etapas concluídas": { "en-US": " steps completed", "es-ES": " etapas completadas" },
  "Agenda": { "en-US": "Schedule", "es-ES": "Agenda" },
  "Compromissos ·": { "en-US": "Appointments ·", "es-ES": "Citas ·" },
  "Carregando agendamentos...": { "en-US": "Loading appointments...", "es-ES": "Cargando citas..." },
  "Nenhum compromisso neste dia.": { "en-US": "No appointments on this day.", "es-ES": "No hay citas para este día." },
  "Sem observação": { "en-US": "No notes", "es-ES": "Sin observaciones" },
  "Agende um compromisso para": { "en-US": "Schedule an appointment for", "es-ES": "Agenda una cita para" },
  "Detalhes do compromisso": { "en-US": "Appointment details", "es-ES": "Detalles de la cita" },
  "Recall": { "en-US": "Recall", "es-ES": "Llamado a revisión" },
  "Cancelar": { "en-US": "Cancel", "es-ES": "Cancelar" },
  "Salvando...": { "en-US": "Saving...", "es-ES": "Guardando..." },
  "Salvar": { "en-US": "Save", "es-ES": "Guardar" },
  "Salvar alterações": { "en-US": "Save changes", "es-ES": "Guardar cambios" },
  "Excluir": { "en-US": "Delete", "es-ES": "Eliminar" },
  "Tem certeza que deseja remover este compromisso?": { "en-US": "Are you sure you want to remove this appointment?", "es-ES": "¿Seguro que quieres eliminar esta cita?" },
  "Não foi possível carregar os agendamentos.": { "en-US": "Could not load appointments.", "es-ES": "No se pudieron cargar las citas." },
  "Preencha horário e cliente": { "en-US": "Enter a time and customer", "es-ES": "Completa la hora y el cliente" },
  "Informe a observação para o tipo Outros": { "en-US": "Enter notes for the Other appointment type", "es-ES": "Añade una observación para el tipo Otros" },
  "Agendamento criado!": { "en-US": "Appointment created!", "es-ES": "¡Cita creada!" },
  "Não foi possível confirmar o agendamento.": { "en-US": "Could not confirm the appointment.", "es-ES": "No se pudo confirmar la cita." },
  "Agendamento removido!": { "en-US": "Appointment removed!", "es-ES": "¡Cita eliminada!" },
  "Não foi possível remover o agendamento.": { "en-US": "Could not remove the appointment.", "es-ES": "No se pudo eliminar la cita." },
  "Produtos, acessórios e promoções exclusivas Toyota.": { "en-US": "Toyota products, accessories, and exclusive offers.", "es-ES": "Productos, accesorios y promociones exclusivas de Toyota." },
  "Promoção Especial": { "en-US": "Special Offer", "es-ES": "Promoción especial" },
  "Kit Revisão Toyota": { "en-US": "Toyota Service Kit", "es-ES": "Kit de revisión Toyota" },
  "Até 20% OFF em kits selecionados de manutenção.": { "en-US": "Up to 20% off selected maintenance kits.", "es-ES": "Hasta un 20 % de descuento en kits de mantenimiento seleccionados." },
  "A partir de R$ 189,90": { "en-US": "Starting at R$ 189.90", "es-ES": "Desde R$ 189,90" },
  "Acessórios Originais": { "en-US": "Genuine Accessories", "es-ES": "Accesorios originales" },
  "Tapetes, protetores e itens exclusivos Toyota.": { "en-US": "Floor mats, protectors, and exclusive Toyota items.", "es-ES": "Alfombrillas, protectores y artículos exclusivos de Toyota." },
  "Promoções especiais": { "en-US": "Special offers", "es-ES": "Promociones especiales" },
  "Linha Lifestyle": { "en-US": "Lifestyle Collection", "es-ES": "Línea Lifestyle" },
  "Bonés, camisetas, garrafas e produtos oficiais.": { "en-US": "Caps, shirts, bottles, and official merchandise.", "es-ES": "Gorras, camisetas, botellas y productos oficiales." },
  "Até 15% OFF": { "en-US": "Up to 15% off", "es-ES": "Hasta un 15 % de descuento" },
  "Tapete Original Toyota": { "en-US": "Genuine Toyota Floor Mat", "es-ES": "Alfombrilla original Toyota" },
  "Boné Toyota Gazoo Racing": { "en-US": "Toyota Gazoo Racing Cap", "es-ES": "Gorra Toyota Gazoo Racing" },
  "Lifestyle": { "en-US": "Lifestyle", "es-ES": "Estilo de vida" },
  "Produtos em destaque": { "en-US": "Featured Products", "es-ES": "Productos destacados" },
  "Escolha produtos originais e acessórios Toyota.": { "en-US": "Choose genuine Toyota products and accessories.", "es-ES": "Elige productos y accesorios originales de Toyota." },
  "Adicionar ao carrinho": { "en-US": "Add to cart", "es-ES": "Añadir al carrito" },
  "Finalize sua compra de produtos Toyota.": { "en-US": "Complete your purchase of Toyota products.", "es-ES": "Completa tu compra de productos Toyota." },
  "Seu carrinho está vazio.": { "en-US": "Your cart is empty.", "es-ES": "Tu carrito está vacío." },
  "Continuar comprando": { "en-US": "Continue shopping", "es-ES": "Seguir comprando" },
  "Pagamento selecionado:": { "en-US": "Selected payment method:", "es-ES": "Método de pago seleccionado:" },
  "Faça login para finalizar a compra.": { "en-US": "Sign in to complete your purchase.", "es-ES": "Inicia sesión para finalizar la compra." },
  "Selecione uma forma de pagamento.": { "en-US": "Select a payment method.", "es-ES": "Selecciona un método de pago." },
  "Produto removido do carrinho.": { "en-US": "Product removed from cart.", "es-ES": "Producto eliminado del carrito." },
  "adicionado ao carrinho!": { "en-US": "added to cart!", "es-ES": "añadido al carrito." },
  "Compra registrada com sucesso!": { "en-US": "Purchase recorded successfully!", "es-ES": "¡Compra registrada correctamente!" },
  "Erro ao registrar compra.": { "en-US": "Error recording purchase.", "es-ES": "Error al registrar la compra." },
  "Perfil do Cliente": { "en-US": "Customer Profile", "es-ES": "Perfil del cliente" },
  "Gerencie suas informações pessoais e segurança da conta.": { "en-US": "Manage your personal information and account security.", "es-ES": "Administra tu información personal y la seguridad de tu cuenta." },
  "Alterar Senha": { "en-US": "Change Password", "es-ES": "Cambiar contraseña" },
  "Conta protegida": { "en-US": "Account protected", "es-ES": "Cuenta protegida" },
  "Seu acesso está ativo e protegido por senha.": { "en-US": "Your account is active and password-protected.", "es-ES": "Tu acceso está activo y protegido con contraseña." },
  "Altere sua senha periodicamente para manter sua conta segura.": { "en-US": "Change your password regularly to keep your account secure.", "es-ES": "Cambia tu contraseña periódicamente para mantener segura tu cuenta." },
  "Limpar histórico": { "en-US": "Clear history", "es-ES": "Borrar historial" },
  "Nenhuma compra realizada": { "en-US": "No purchases yet", "es-ES": "Aún no hay compras" },
  "Explore acessórios e produtos exclusivos Toyota.": { "en-US": "Explore exclusive Toyota accessories and products.", "es-ES": "Descubre accesorios y productos exclusivos de Toyota." },
  "Pedido #": { "en-US": "Order #", "es-ES": "Pedido n.º " },
  "Editar perfil": { "en-US": "Edit profile", "es-ES": "Editar perfil" },
  "Atualize suas informações pessoais.": { "en-US": "Update your personal information.", "es-ES": "Actualiza tu información personal." },
  "Endereço": { "en-US": "Address", "es-ES": "Dirección" },
  "Informe sua senha atual e escolha uma nova senha.": { "en-US": "Enter your current password and choose a new one.", "es-ES": "Ingresa tu contraseña actual y elige una nueva." },
  "Senha atual": { "en-US": "Current password", "es-ES": "Contraseña actual" },
  "Nova senha": { "en-US": "New password", "es-ES": "Nueva contraseña" },
  "Confirmar nova senha": { "en-US": "Confirm new password", "es-ES": "Confirmar nueva contraseña" },
  "Cliente inválido.": { "en-US": "Invalid customer.", "es-ES": "Cliente no válido." },
  "Preencha nome e telefone.": { "en-US": "Enter your name and phone number.", "es-ES": "Completa tu nombre y teléfono." },
  "Perfil atualizado!": { "en-US": "Profile updated!", "es-ES": "¡Perfil actualizado!" },
  "Erro ao atualizar perfil.": { "en-US": "Error updating profile.", "es-ES": "Error al actualizar el perfil." },
  "Preencha a senha atual e a nova senha.": { "en-US": "Enter your current and new passwords.", "es-ES": "Completa la contraseña actual y la nueva." },
  "Senha atual incorreta.": { "en-US": "Current password is incorrect.", "es-ES": "La contraseña actual es incorrecta." },
  "As senhas não coincidem.": { "en-US": "Passwords do not match.", "es-ES": "Las contraseñas no coinciden." },
  "A nova senha deve ter pelo menos 6 caracteres.": { "en-US": "The new password must contain at least 6 characters.", "es-ES": "La nueva contraseña debe tener al menos 6 caracteres." },
  "Senha alterada com sucesso!": { "en-US": "Password changed successfully!", "es-ES": "¡Contraseña cambiada correctamente!" },
  "Erro ao alterar senha.": { "en-US": "Error changing password.", "es-ES": "Error al cambiar la contraseña." },
  "Histórico de compras apagado.": { "en-US": "Purchase history cleared.", "es-ES": "Se borró el historial de compras." },
  "Erro ao limpar histórico.": { "en-US": "Error clearing history.", "es-ES": "Error al borrar el historial." },
  "Valor Total": { "en-US": "Total Amount", "es-ES": "Importe total" },
  "Entrada": { "en-US": "Down Payment", "es-ES": "Pago inicial" },
  "Parcelas": { "en-US": "Installments", "es-ES": "Cuotas" },
  "Valor Pendente": { "en-US": "Outstanding Amount", "es-ES": "Importe pendiente" },
  "Taxa de Juros": { "en-US": "Interest Rate", "es-ES": "Tasa de interés" },
  "Veja e simule o pagamento das parcelas por veículo.": { "en-US": "View and simulate installment payments for each vehicle.", "es-ES": "Consulta y simula el pago de cuotas de cada vehículo." },
  "Nenhum veículo com financiamento encontrado.": { "en-US": "No financed vehicles found.", "es-ES": "No se encontraron vehículos financiados." },
  "% do valor": { "en-US": "% of amount", "es-ES": "% del importe" },
  " restantes": { "en-US": " remaining", "es-ES": " restantes" },
  " pagas · ": { "en-US": " paid · ", "es-ES": " pagadas · " },
  "Último mês pago:": { "en-US": "Last month paid:", "es-ES": "Último mes pagado:" },
  " ao ano": { "en-US": " per year", "es-ES": " al año" },
  " a.m.": { "en-US": " per month", "es-ES": " al mes" },
  "Escolha a forma de pagamento e confirme para dar baixa na parcela.": { "en-US": "Choose a payment method and confirm to record the installment payment.", "es-ES": "Elige un método de pago y confirma para registrar el pago de la cuota." },
  "Financiamento quitado": { "en-US": "Financing paid off", "es-ES": "Financiación pagada" },
  "Valor da parcela:": { "en-US": "Installment amount:", "es-ES": "Importe de la cuota:" },
  "Nome impresso no cartão": { "en-US": "Name on card", "es-ES": "Nombre del titular" },
  "Número do cartão": { "en-US": "Card number", "es-ES": "Número de tarjeta" },
  "Validade": { "en-US": "Expiry date", "es-ES": "Vencimiento" },
  "CPF do titular": { "en-US": "Cardholder tax ID", "es-ES": "Documento del titular" },
  "Selecione um veículo.": { "en-US": "Select a vehicle.", "es-ES": "Selecciona un vehículo." },
  "Financiamento já quitado!": { "en-US": "Financing is already paid off!", "es-ES": "¡La financiación ya está pagada!" },
  "Parcela paga com sucesso!": { "en-US": "Installment paid successfully!", "es-ES": "¡Cuota pagada correctamente!" },
  "Erro ao pagar parcela.": { "en-US": "Error paying installment.", "es-ES": "Error al pagar la cuota." },
  "Preencha todos os dados do cartão.": { "en-US": "Enter all card details.", "es-ES": "Completa todos los datos de la tarjeta." },
  "Informe o CPF para gerar o PIX.": { "en-US": "Enter your tax ID to generate the PIX payment.", "es-ES": "Ingresa tu documento para generar el pago PIX." },
  "Nova experiência Toyota": { "en-US": "A new Toyota experience", "es-ES": "Una nueva experiencia Toyota" },
  "Garantia Toyota 10": { "en-US": "Toyota 10 Warranty", "es-ES": "Garantía Toyota 10" },
  "Começar": { "en-US": "Get started", "es-ES": "Comenzar" },
  "Role para explorar": { "en-US": "Scroll to explore", "es-ES": "Desplázate para explorar" },
  "Escolha sua experiência": { "en-US": "Choose your experience", "es-ES": "Elige tu experiencia" },
  "Experiência digital": { "en-US": "Digital experience", "es-ES": "Experiencia digital" },
  "Por que usar o Toyota ACE?": { "en-US": "Why use Toyota ACE?", "es-ES": "¿Por qué usar Toyota ACE?" },
  "Informações importantes do seu veículo em poucos cliques, com navegação simples e intuitiva.": { "en-US": "Important vehicle information in a few clicks, with simple and intuitive navigation.", "es-ES": "Información importante de tu vehículo en pocos clics, con navegación sencilla e intuitiva." },
  "Acompanhe pedidos, revisões, atualizações e serviços em tempo real, direto pela plataforma.": { "en-US": "Track orders, maintenance, updates, and services in real time on the platform.", "es-ES": "Consulta pedidos, revisiones, actualizaciones y servicios en tiempo real desde la plataforma." },
  "Uma jornada digital moderna, prática e pensada para deixar o cliente mais próximo da marca.": { "en-US": "A modern, practical digital journey that brings customers closer to the brand.", "es-ES": "Una experiencia digital moderna y práctica que acerca al cliente a la marca." },
  "Tradição": { "en-US": "Heritage", "es-ES": "Tradición" },
  "A história da Toyota": { "en-US": "The story of Toyota", "es-ES": "La historia de Toyota" },
  "Fundada em 1937, a Toyota revolucionou a indústria automotiva com inovação, qualidade e tecnologia sustentável.": { "en-US": "Founded in 1937, Toyota transformed the automotive industry through innovation, quality, and sustainable technology.", "es-ES": "Fundada en 1937, Toyota revolucionó la industria automotriz con innovación, calidad y tecnología sostenible." },
  "Dos modelos clássicos aos veículos híbridos e elétricos, a marca segue transformando o futuro da mobilidade com responsabilidade, confiança e excelência.": { "en-US": "From classic models to hybrid and electric vehicles, Toyota continues to shape the future of mobility with responsibility, trust, and excellence.", "es-ES": "Desde los modelos clásicos hasta los vehículos híbridos y eléctricos, Toyota sigue transformando el futuro de la movilidad con responsabilidad, confianza y excelencia." },
  "Sua jornada Toyota começa aqui.": { "en-US": "Your Toyota journey starts here.", "es-ES": "Tu experiencia Toyota comienza aquí." },
  "Crie sua conta e acompanhe tudo sobre seu veículo de forma simples, rápida e conectada.": { "en-US": "Create an account and easily track everything about your vehicle in one connected place.", "es-ES": "Crea una cuenta y consulta todo sobre tu vehículo de forma sencilla, rápida y conectada." },
  "Começar agora": { "en-US": "Get started now", "es-ES": "Comenzar ahora" },
  "Login": { "en-US": "Sign in", "es-ES": "Iniciar sesión" },
  "O CPF deve conter exatamente 11 números.": { "en-US": "The tax ID must contain exactly 11 digits.", "es-ES": "El documento debe contener exactamente 11 dígitos." },
  "A senha deve ter 8 ou mais caracteres, com maiúscula, minúscula, número e símbolo.": { "en-US": "Password must be at least 8 characters and include uppercase, lowercase, a number, and a symbol.", "es-ES": "La contraseña debe tener al menos 8 caracteres e incluir mayúsculas, minúsculas, un número y un símbolo." },
  "Preencha nome, CPF, email e senha.": { "en-US": "Enter your name, tax ID, email, and password.", "es-ES": "Completa el nombre, documento, correo y contraseña." },
  "Não foi possível criar sua conta.": { "en-US": "Could not create your account.", "es-ES": "No se pudo crear tu cuenta." },
  "Criando conta...": { "en-US": "Creating account...", "es-ES": "Creando cuenta..." },
  "Mínimo de 8 caracteres, com maiúscula, minúscula, número e símbolo.": { "en-US": "At least 8 characters, including uppercase, lowercase, a number, and a symbol.", "es-ES": "Al menos 8 caracteres, con mayúsculas, minúsculas, un número y un símbolo." },
  "Digite seu email.": { "en-US": "Enter your email.", "es-ES": "Escribe tu correo electrónico." },
  "Se o email existir, enviaremos instruções para recuperação.": { "en-US": "If the email exists, we will send recovery instructions.", "es-ES": "Si el correo existe, enviaremos instrucciones de recuperación." },
  "Recuperar Senha": { "en-US": "Recover Password", "es-ES": "Recuperar contraseña" },
  "Informe seu email para receber instruções de recuperação": { "en-US": "Enter your email to receive recovery instructions", "es-ES": "Escribe tu correo para recibir instrucciones de recuperación" },
  "Enviar instruções": { "en-US": "Send instructions", "es-ES": "Enviar instrucciones" },
  "Lembrou a senha?": { "en-US": "Remember your password?", "es-ES": "¿Recordaste tu contraseña?" },
  "Voltar ao login": { "en-US": "Back to sign in", "es-ES": "Volver al inicio de sesión" },
  "Entrando...": { "en-US": "Signing in...", "es-ES": "Iniciando sesión..." },
  "Preencha todos os campos.": { "en-US": "Complete all fields.", "es-ES": "Completa todos los campos." },
  "E-mail ou senha inválidos.": { "en-US": "Invalid email or password.", "es-ES": "Correo o contraseña incorrectos." },
  "Assistente virtual online": { "en-US": "Virtual assistant online", "es-ES": "Asistente virtual en línea" },
  "Online": { "en-US": "Online", "es-ES": "En línea" },
  "Digitando...": { "en-US": "Typing...", "es-ES": "Escribiendo..." },
  "Erro na resposta do servidor": { "en-US": "Server response error", "es-ES": "Error en la respuesta del servidor" },
  "Não consegui entender sua pergunta.": { "en-US": "I couldn't understand your question.", "es-ES": "No pude entender tu pregunta." },
  "Erro ao conectar com o chatbot. Verifique se o Flask está rodando na porta 5000.": { "en-US": "Could not connect to the chatbot. Check that Flask is running on port 5000.", "es-ES": "No se pudo conectar con el chatbot. Comprueba que Flask esté ejecutándose en el puerto 5000." },
  "Toggle Sidebar": { "en-US": "Toggle Sidebar", "es-ES": "Alternar barra lateral" },
  "Diminuir tamanho do texto": { "en-US": "Decrease text size", "es-ES": "Reducir tamaño del texto" },
  "Aumentar tamanho do texto": { "en-US": "Increase text size", "es-ES": "Aumentar tamaño del texto" },
  "Janeiro": { "en-US": "January", "es-ES": "Enero" },
  "Fevereiro": { "en-US": "February", "es-ES": "Febrero" },
  "Março": { "en-US": "March", "es-ES": "Marzo" },
  "Abril": { "en-US": "April", "es-ES": "Abril" },
  "Maio": { "en-US": "May", "es-ES": "Mayo" },
  "Junho": { "en-US": "June", "es-ES": "Junio" },
  "Julho": { "en-US": "July", "es-ES": "Julio" },
  "Agosto": { "en-US": "August", "es-ES": "Agosto" },
  "Setembro": { "en-US": "September", "es-ES": "Septiembre" },
  "Outubro": { "en-US": "October", "es-ES": "Octubre" },
  "Novembro": { "en-US": "November", "es-ES": "Noviembre" },
  "Dezembro": { "en-US": "December", "es-ES": "Diciembre" },
  "Acompanhe seu veículo, pedidos, revisões e serviços em uma plataforma moderna, conectada e feita para melhorar sua jornada.": { "en-US": "Track your vehicle, orders, maintenance, and services on a modern, connected platform designed to improve your journey.", "es-ES": "Consulta tu vehículo, pedidos, revisiones y servicios en una plataforma moderna y conectada, diseñada para mejorar tu experiencia." },
  "Força, tecnologia e presença.": { "en-US": "Strength, technology, and presence.", "es-ES": "Fuerza, tecnología y presencia." },
  "Elegância para todos os caminhos.": { "en-US": "Elegance for every road.", "es-ES": "Elegancia para todos los caminos." },
  "Conforto urbano com estilo.": { "en-US": "Urban comfort with style.", "es-ES": "Confort urbano con estilo." },
  "Oops! Page not found": { "en-US": "Oops! Page not found", "es-ES": "¡Vaya! Página no encontrada" },
  "Return to Home": { "en-US": "Return to Home", "es-ES": "Volver al inicio" },
  "Olá! 👋 Bem-vindo ao Toyota ACE. Como posso ajudar você hoje?": { "en-US": "Hello! 👋 Welcome to Toyota ACE. How can I help you today?", "es-ES": "¡Hola! 👋 Te damos la bienvenida a Toyota ACE. ¿Cómo puedo ayudarte hoy?" },
  "🛡️ Garantia": { "en-US": "🛡️ Warranty", "es-ES": "🛡️ Garantía" },
  "💰 Financiamento": { "en-US": "💰 Financing", "es-ES": "💰 Financiación" },
  "📅 Retirada": { "en-US": "📅 Pickup", "es-ES": "📅 Recogida" },
  "Selecione um horário disponível": { "en-US": "Select an available time", "es-ES": "Selecciona un horario disponible" },
  "Nenhum horário disponível nesta data.": { "en-US": "No time slots are available on this date.", "es-ES": "No hay horarios disponibles en esta fecha." },
  "Este horário acabou de ser reservado. Escolha outro.": { "en-US": "This time was just booked. Choose another.", "es-ES": "Este horario acaba de reservarse. Elige otro." },
  "Este horário já está reservado. Escolha outro.": { "en-US": "This time is already booked. Choose another.", "es-ES": "Este horario ya está reservado. Elige otro." },
};

const japaneseTranslations: Record<string, string> = {
  "Carregando...": "読み込み中...",
  "Sair": "ログアウト",
  "Todos os direitos reservados": "無断転載を禁じます",
  "Acesse sua conta para acompanhar seu veículo": "ログインして車両情報を確認してください",
  "Email": "メールアドレス",
  "Senha": "パスワード",
  "Esqueci minha senha": "パスワードを忘れた場合",
  "Não tem conta?": "アカウントをお持ちでない方",
  "Cadastre-se": "新規登録",
  "Entrar": "ログイン",
  "Criar Conta": "アカウントを作成",
  "Cadastre-se para acompanhar seu veículo": "車両情報を確認するために登録してください",
  "Nome": "氏名",
  "Seu nome": "氏名を入力",
  " de ": " / ",
  " etapas concluídas": " ステップ完了",
  "Telefone": "電話番号",
  "Confirmar Senha": "パスワードを確認",
  "Já tem conta?": "すでにアカウントをお持ちですか？",
  "Dashboard": "ダッシュボード",
  "Veículos": "車両",
  "Financiamento": "ローン",
  "Agendamentos": "予約",
  "Perfil": "プロフィール",
  "Toyota Shop": "Toyota ショップ",
  "Carregando dashboard...": "ダッシュボードを読み込み中...",
  "Ver veículo": "車両を見る",
  "Ver financiamento": "ローンを確認",
  "Central de avisos": "お知らせ",
  "Ações rápidas": "クイックアクション",
  "Dados Pessoais": "個人情報",
  "Segurança da Conta": "アカウントのセキュリティ",
  "Editar Perfil": "プロフィールを編集",
  "Alterar senha": "パスワードを変更",
  "Senha de acesso": "ログインパスワード",
  "Compras Toyota Shop": "Toyota ショップの購入履歴",
  "Ir para Toyota Shop": "Toyota ショップへ",
  "Carregando financiamento...": "ローン情報を読み込み中...",
  "Pagamento simulado": "お支払いのシミュレーション",
  "Próxima parcela": "次回のお支払い",
  "Pagamento da parcela": "分割払いのお支払い",
  "Cartão de crédito": "クレジットカード",
  "Cartão de débito": "デビットカード",
  "Boleto": "請求書払い",
  "Novo agendamento": "新しい予約",
  "Excluir agendamento": "予約を削除",
  "Horário": "時間",
  "Cliente": "お客様",
  "Tipo": "種類",
  "Observação": "備考",
  "Revisão": "点検",
  "Retirada": "お車の受け取り",
  "Outros": "その他",
  "Carrinho": "カート",
  "Carrinho de compras": "ショッピングカート",
  "Subtotal": "小計",
  "Desconto": "割引",
  "Total": "合計",
  "Forma de pagamento": "お支払い方法",
  "Novo veículo": "新しい車両",
  "Marca": "メーカー",
  "Modelo": "モデル",
  "Ano": "年式",
  "Motor": "エンジン",
  "Cor": "色",
  "Câmbio": "トランスミッション",
  "Combustível": "燃料",
  "Chassi": "車台番号",
  "Próxima revisão": "次回点検",
  "Timeline de Fabricação": "製造工程",
  "Progresso": "進捗状況",
  "Acessibilidade": "アクセシビリティ",
  "Conectividade": "コネクティビティ",
  "Experiência": "体験",
  "Explorar agora": "今すぐ見る",
  "Digite sua mensagem...": "メッセージを入力...",
  "seu@email.com": "メールアドレス",
  "Nome do cliente": "お客様の氏名",
  "Selecione o tipo": "種類を選択",
  "Selecione uma forma de pagamento": "お支払い方法を選択",
  "Veículo": "車両",
  "Agendamento": "予約",
  "Bem-vindo ao seu portal Toyota ACE.": "Toyota ACE ポータルへようこそ。",
  "Veículo principal": "メインの車両",
  "Nenhum veículo vinculado": "登録車両はありません",
  "Ano não informado": "年式未登録",
  "Cor não informada": "色未登録",
  "Quando um veículo for atribuído, ele aparecerá aqui.": "車両が登録されると、ここに表示されます。",
  "Escolher veículo principal": "メイン車両を選択",
  "Etapa atual": "現在の段階",
  "Pronto para retirada": "お車をお受け取りいただけます",
  "Concessionária": "販売店",
  "Transporte": "輸送中",
  "Inspeção": "検査",
  "Linha de produção": "生産ライン",
  "Pedido realizado": "ご注文済み",
  "Aguardando atualização": "更新待ち",
  "veículo(s) vinculado(s)": "台の登録車両",
  "Não informada": "未登録",
  "mantenha sua garantia ativa": "保証を有効に保ちましょう",
  "Acessórios": "アクセサリー",
  "produtos exclusivos Toyota": "Toyota 限定商品",
  "Acompanhamento do veículo": "車両の状況",
  "Nenhum veículo vinculado ao seu cadastro.": "お客様のアカウントに車両が登録されていません。",
  "Nenhum financiamento pendente informado.": "未払いのローンはありません。",
  "Garantia": "保証",
  "Status de garantia não informado.": "保証状況は未登録です。",
  "Agendar serviço": "サービスを予約",
  "Pagar parcela": "分割払いを支払う",
  "Ver timeline": "工程を確認",
  "Comprar acessórios": "アクセサリーを購入",
  "Meus Veículos": "マイカー",
  "Selecione um veículo para acompanhar ficha técnica e fabricação.": "車両を選択して仕様と製造状況を確認してください。",
  "Carregando veículos...": "車両情報を読み込み中...",
  "Não foi possível carregar os veículos.": "車両情報を読み込めませんでした。",
  "Nenhum veículo vinculado ao seu cadastro ainda.": "お客様のアカウントに車両はまだ登録されていません。",
  "Veículo sem modelo": "モデル未登録",
  "Aguardando status": "状況確認中",
  "Não informado": "未登録",
  "Cegonha": "陸送中",
  "Seu pedido foi registrado no sistema da concessionária.": "ご注文は販売店のシステムに登録されました。",
  "O veículo entrou na linha de produção da fábrica.": "車両は工場の生産ラインに入りました。",
  "São realizados testes de qualidade e segurança.": "品質と安全性の検査を行っています。",
  "O veículo está em transporte para a concessionária.": "車両は販売店へ輸送中です。",
  "O veículo chegou à concessionária e está em preparação.": "車両は販売店に到着し、納車準備中です。",
  "Seu veículo está pronto para ser retirado.": "お車をお受け取りいただけます。",
  "Agenda": "予約",
  "Compromissos ·": "予約 ·",
  "Carregando agendamentos...": "予約を読み込み中...",
  "Nenhum compromisso neste dia.": "この日の予約はありません。",
  "Sem observação": "備考なし",
  "Agende um compromisso para": "予約日時を選択してください",
  "Detalhes do compromisso": "予約の詳細",
  "Recall": "リコール",
  "Cancelar": "キャンセル",
  "Salvando...": "保存中...",
  "Salvar": "保存",
  "Salvar alterações": "変更を保存",
  "Excluir": "削除",
  "Tem certeza que deseja remover este compromisso?": "この予約を削除してもよろしいですか？",
  "Não foi possível carregar os agendamentos.": "予約を読み込めませんでした。",
  "Preencha horário e cliente": "時間とお客様を入力してください",
  "Informe a observação para o tipo Outros": "「その他」の予約内容を入力してください",
  "Agendamento criado!": "予約が完了しました。",
  "Não foi possível confirmar o agendamento.": "予約を確定できませんでした。",
  "Agendamento removido!": "予約を削除しました。",
  "Não foi possível remover o agendamento.": "予約を削除できませんでした。",
  "Produtos, acessórios e promoções exclusivas Toyota.": "Toyota の商品、アクセサリー、お得なキャンペーン。",
  "Promoção Especial": "特別キャンペーン",
  "Kit Revisão Toyota": "Toyota 点検キット",
  "Até 20% OFF em kits selecionados de manutenção.": "対象のメンテナンスキットが最大20%割引。",
  "A partir de R$ 189,90": "189.90レアルから",
  "Acessórios Originais": "純正アクセサリー",
  "Tapetes, protetores e itens exclusivos Toyota.": "フロアマット、プロテクターなどToyota限定商品。",
  "Promoções especiais": "特別価格",
  "Linha Lifestyle": "ライフスタイルコレクション",
  "Bonés, camisetas, garrafas e produtos oficiais.": "キャップ、Tシャツ、ボトルなどの公式商品。",
  "Até 15% OFF": "最大15%割引",
  "Tapete Original Toyota": "Toyota 純正フロアマット",
  "Boné Toyota Gazoo Racing": "Toyota Gazoo Racing キャップ",
  "Lifestyle": "ライフスタイル",
  "Produtos em destaque": "おすすめ商品",
  "Escolha produtos originais e acessórios Toyota.": "Toyota 純正商品とアクセサリーをお選びください。",
  "Adicionar ao carrinho": "カートに追加",
  "Finalize sua compra de produtos Toyota.": "Toyota 商品の購入手続きを完了してください。",
  "Seu carrinho está vazio.": "カートは空です。",
  "Continuar comprando": "買い物を続ける",
  "Pagamento selecionado:": "選択したお支払い方法:",
  "Faça login para finalizar a compra.": "ログインして購入を完了してください。",
  "Selecione uma forma de pagamento.": "お支払い方法を選択してください。",
  "Produto removido do carrinho.": "商品をカートから削除しました。",
  "adicionado ao carrinho!": "をカートに追加しました。",
  "Compra registrada com sucesso!": "ご注文を登録しました。",
  "Erro ao registrar compra.": "注文を登録できませんでした。",
  "Perfil do Cliente": "お客様プロフィール",
  "Gerencie suas informações pessoais e segurança da conta.": "個人情報とアカウントのセキュリティを管理します。",
  "Alterar Senha": "パスワードを変更",
  "Conta protegida": "アカウントは保護されています",
  "Seu acesso está ativo e protegido por senha.": "アカウントは有効で、パスワードにより保護されています。",
  "Altere sua senha periodicamente para manter sua conta segura.": "安全のため、定期的にパスワードを変更してください。",
  "Limpar histórico": "履歴を削除",
  "Nenhuma compra realizada": "購入履歴はありません",
  "Explore acessórios e produtos exclusivos Toyota.": "Toyota 限定アクセサリーや商品をご覧ください。",
  "Pedido #": "注文番号 #",
  "Editar perfil": "プロフィールを編集",
  "Atualize suas informações pessoais.": "個人情報を更新してください。",
  "Endereço": "住所",
  "Informe sua senha atual e escolha uma nova senha.": "現在のパスワードを入力し、新しいパスワードを設定してください。",
  "Senha atual": "現在のパスワード",
  "Nova senha": "新しいパスワード",
  "Confirmar nova senha": "新しいパスワードを確認",
  "Cliente inválido.": "お客様情報が無効です。",
  "Preencha nome e telefone.": "氏名と電話番号を入力してください。",
  "Perfil atualizado!": "プロフィールを更新しました。",
  "Erro ao atualizar perfil.": "プロフィールを更新できませんでした。",
  "Preencha a senha atual e a nova senha.": "現在と新しいパスワードを入力してください。",
  "Senha atual incorreta.": "現在のパスワードが正しくありません。",
  "As senhas não coincidem.": "パスワードが一致しません。",
  "A nova senha deve ter pelo menos 6 caracteres.": "新しいパスワードは6文字以上で入力してください。",
  "Senha alterada com sucesso!": "パスワードを変更しました。",
  "Erro ao alterar senha.": "パスワードを変更できませんでした。",
  "Histórico de compras apagado.": "購入履歴を削除しました。",
  "Erro ao limpar histórico.": "履歴を削除できませんでした。",
  "Valor Total": "合計金額",
  "Entrada": "頭金",
  "Parcelas": "分割回数",
  "Valor Pendente": "未払い金額",
  "Taxa de Juros": "金利",
  "Veja e simule o pagamento das parcelas por veículo.": "車両ごとの分割払いを確認・シミュレーションできます。",
  "Nenhum veículo com financiamento encontrado.": "ローン契約のある車両はありません。",
  "% do valor": "%",
  " restantes": " 残り",
  " pagas · ": " 回支払い済み · ",
  "Último mês pago:": "前回のお支払い月:",
  " ao ano": " 年率",
  " a.m.": " 月利",
  "Escolha a forma de pagamento e confirme para dar baixa na parcela.": "お支払い方法を選択し、確定してください。",
  "Financiamento quitado": "ローン完済",
  "Valor da parcela:": "分割払い金額:",
  "Nome impresso no cartão": "カード名義",
  "Número do cartão": "カード番号",
  "Validade": "有効期限",
  "CPF do titular": "カード名義人のCPF",
  "Selecione um veículo.": "車両を選択してください。",
  "Financiamento já quitado!": "ローンはすでに完済しています。",
  "Parcela paga com sucesso!": "お支払いが完了しました。",
  "Erro ao pagar parcela.": "お支払いを処理できませんでした。",
  "Preencha todos os dados do cartão.": "カード情報をすべて入力してください。",
  "Informe o CPF para gerar o PIX.": "PIXを発行するにはCPFを入力してください。",
  "Nova experiência Toyota": "新しいToyota体験",
  "Garantia Toyota 10": "Toyota 10年保証",
  "Começar": "始める",
  "Role para explorar": "スクロールしてご覧ください",
  "Escolha sua experiência": "お好みの体験をお選びください",
  "Experiência digital": "デジタル体験",
  "Por que usar o Toyota ACE?": "Toyota ACEを使う理由",
  "Informações importantes do seu veículo em poucos cliques, com navegação simples e intuitiva.": "簡単な操作で、車両の大切な情報をすぐに確認できます。",
  "Acompanhe pedidos, revisões, atualizações e serviços em tempo real, direto pela plataforma.": "注文、点検、更新情報、サービスをリアルタイムで確認できます。",
  "Uma jornada digital moderna, prática e pensada para deixar o cliente mais próximo da marca.": "お客様とブランドをつなぐ、便利で快適なデジタル体験をお届けします。",
  "Tradição": "伝統",
  "A história da Toyota": "Toyotaの歩み",
  "Fundada em 1937, a Toyota revolucionou a indústria automotiva com inovação, qualidade e tecnologia sustentável.": "1937年の創業以来、Toyotaは革新、品質、持続可能な技術で自動車産業を変革してきました。",
  "Dos modelos clássicos aos veículos híbridos e elétricos, a marca segue transformando o futuro da mobilidade com responsabilidade, confiança e excelência.": "名車からハイブリッド車、電気自動車まで、Toyotaは信頼と責任をもってモビリティの未来を切り拓きます。",
  "Sua jornada Toyota começa aqui.": "Toyotaとの新しい毎日をここから。",
  "Crie sua conta e acompanhe tudo sobre seu veículo de forma simples, rápida e conectada.": "アカウントを作成して、車両情報をいつでも簡単に確認しましょう。",
  "Começar agora": "今すぐ始める",
  "Login": "ログイン",
  "O CPF deve conter exatamente 11 números.": "CPFは11桁で入力してください。",
  "A senha deve ter 8 ou mais caracteres, com maiúscula, minúscula, número e símbolo.": "パスワードは8文字以上で、大文字、小文字、数字、記号を含めてください。",
  "Preencha nome, CPF, email e senha.": "氏名、CPF、メールアドレス、パスワードを入力してください。",
  "Não foi possível criar sua conta.": "アカウントを作成できませんでした。",
  "Criando conta...": "アカウントを作成中...",
  "Mínimo de 8 caracteres, com maiúscula, minúscula, número e símbolo.": "8文字以上で、大文字、小文字、数字、記号を含めてください。",
  "Digite seu email.": "メールアドレスを入力してください。",
  "Se o email existir, enviaremos instruções para recuperação.": "登録済みの場合、再設定方法をメールでお送りします。",
  "Recuperar Senha": "パスワードを再設定",
  "Informe seu email para receber instruções de recuperação": "再設定方法を受け取るメールアドレスを入力してください",
  "Enviar instruções": "案内を送信",
  "Lembrou a senha?": "パスワードを思い出しましたか？",
  "Voltar ao login": "ログインに戻る",
  "Entrando...": "ログイン中...",
  "Preencha todos os campos.": "すべての項目を入力してください。",
  "E-mail ou senha inválidos.": "メールアドレスまたはパスワードが正しくありません。",
  "Assistente virtual online": "オンライン・バーチャルアシスタント",
  "Online": "オンライン",
  "Digitando...": "入力中...",
  "Erro na resposta do servidor": "サーバーからの応答にエラーが発生しました。",
  "Não consegui entender sua pergunta.": "ご質問を理解できませんでした。",
  "Erro ao conectar com o chatbot. Verifique se o Flask está rodando na porta 5000.": "アシスタントに接続できません。Flaskがポート5000で起動しているか確認してください。",
  "Diminuir tamanho do texto": "文字を小さくする",
  "Aumentar tamanho do texto": "文字を大きくする",
  "Olá! 👋 Bem-vindo ao Toyota ACE. Como posso ajudar você hoje?": "こんにちは。Toyota ACEへようこそ。どのようなお手伝いができますか？",
  "🛡️ Garantia": "🛡️ 保証",
  "💰 Financiamento": "💰 ローン",
  "📅 Retirada": "📅 お車の受け取り",
  "Selecione um horário disponível": "空いている時間を選択してください",
  "Nenhum horário disponível nesta data.": "この日に空いている時間はありません。",
  "Este horário acabou de ser reservado. Escolha outro.": "この時間は予約されました。別の時間を選択してください。",
  "Este horário já está reservado. Escolha outro.": "この時間はすでに予約済みです。別の時間を選択してください。",
};

Object.assign(translations, {
  "Shop": { "en-US": "Shop", "es-ES": "Tienda" },
  "PIX": { "en-US": "PIX", "es-ES": "PIX" },
  "CVV": { "en-US": "CVV", "es-ES": "CVV" },
  "Finalizar": { "en-US": "Close", "es-ES": "Cerrar" },
  "Nenhum veículo vinculado": { "en-US": "No vehicle linked", "es-ES": "Ningún vehículo vinculado" },
  "Não encontramos veículos vinculados ao seu perfil.": { "en-US": "No vehicles are linked to your profile.", "es-ES": "No hay vehículos vinculados a tu perfil." },
  "Quando um veículo for atribuído, ele aparecerá aqui.": { "en-US": "When a vehicle is assigned, it will appear here.", "es-ES": "Cuando se asigne un vehículo, aparecerá aquí." },
  "Escolher veículo principal": { "en-US": "Choose main vehicle", "es-ES": "Elegir vehículo principal" },
  "Nenhum veículo com financiamento encontrado.": { "en-US": "No financed vehicles found.", "es-ES": "No se encontraron vehículos financiados." },
  "Nenhum horário disponível nesta data.": { "en-US": "No time slots are available on this date.", "es-ES": "No hay horarios disponibles en esta fecha." },
  "Nome impresso no cartão": { "en-US": "Name on card", "es-ES": "Nombre del titular" },
  "Número do cartão": { "en-US": "Card number", "es-ES": "Número de tarjeta" },
  "Validade": { "en-US": "Expiry date", "es-ES": "Vencimiento" },
  "CPF para gerar PIX": { "en-US": "Tax ID to generate PIX", "es-ES": "Documento para generar PIX" },
});

Object.assign(japaneseTranslations, {
  "Shop": "ショップ",
  "PIX": "PIX",
  "CVV": "セキュリティコード",
  "Finalizar": "閉じる",
  "Nenhum veículo vinculado": "登録車両はありません",
  "Não encontramos veículos vinculados ao seu perfil.": "プロフィールに登録された車両はありません。",
  "Quando um veículo for atribuído, ele aparecerá aqui.": "車両が登録されると、ここに表示されます。",
  "Escolher veículo principal": "メイン車両を選択",
  "Nenhum veículo com financiamento encontrado.": "ローン契約のある車両はありません。",
  "Nenhum horário disponível nesta data.": "この日に空いている時間はありません。",
  "Nome impresso no cartão": "カード名義",
  "Número do cartão": "カード番号",
  "Validade": "有効期限",
  "CPF para gerar PIX": "PIXを発行するにはCPFを入力してください",
});

// Complete the dictionaries with labels shared with the mobile application.
Object.entries(translationSupplement).forEach(([source, values]) => {
  const current = translations[source] || {};
  translations[source] = {
    ...current,
    "en-US": current["en-US"] || values["en-US"],
    "es-ES": current["es-ES"] || values["es-ES"],
  } as Translation;

  if (!japaneseTranslations[source]) {
    japaneseTranslations[source] = values["ja-JP"];
  }
});

const portugueseOverrides: Record<string, string> = {
  "Oops! Page not found": "Ops! Página não encontrada",
  "Return to Home": "Voltar para a página inicial",
  "Toggle Sidebar": "Alternar barra lateral",
  "Dashboard": "Painel",
  "Lifestyle": "Estilo de vida",
  "Toyota Shop": "Loja Toyota",
  "Email": "E-mail",
};

const reverse: Record<string, string> = Object.fromEntries(
  [
    ...Object.entries(translations).flatMap(([source, values]) =>
      Object.values(values).filter((value) => value.length > 0).map((value) => [value, source]),
    ),
    ...Object.entries(japaneseTranslations)
      .filter(([, value]) => value.length > 0)
      .map(([source, value]) => [value, source]),
  ],
);

const originalText = new WeakMap<Text, string>();
const translatedText = new WeakMap<Text, string>();
const originalAttributes = new WeakMap<Element, Map<string, string>>();
const translatedAttributes = new WeakMap<Element, Map<string, string>>();

function translateAttribute(element: Element, attribute: string, language: Language) {
  const current = element.getAttribute(attribute);
  if (current === null) return;

  let originals = originalAttributes.get(element);
  let translated = translatedAttributes.get(element);
  if (!originals) {
    originals = new Map<string, string>();
    originalAttributes.set(element, originals);
  }
  if (!translated) {
    translated = new Map<string, string>();
    translatedAttributes.set(element, translated);
  }

  if (!originals.has(attribute) || current !== translated.get(attribute)) {
    originals.set(attribute, current);
  }

  const source = originals.get(attribute) || current;
  const result = translate(source, language);
  if (result !== current) element.setAttribute(attribute, result);
  translated.set(attribute, result);
}

function translateDynamic(value: string, language: Language) {
  const match = value.match(/^Olá, (.+) 👋$/);
  if (match) {
    if (language === "ja-JP") return `こんにちは、${match[1]} 👋`;
    return `${language === "en-US" ? "Hello" : "Hola"}, ${match[1]} 👋`;
  }

  const appointmentCount = value.match(/^Compromissos · (\d+)$/);
  if (appointmentCount) {
    const label = language === "en-US" ? "Appointments" : language === "ja-JP" ? "予約" : "Citas";
    return `${label} · ${appointmentCount[1]}`;
  }

  const completedSteps = value.match(/^(\d+) de (\d+) etapas concluídas$/);
  if (completedSteps) {
    if (language === "ja-JP") return `${completedSteps[1]} / ${completedSteps[2]} ステップ完了`;
    return language === "en-US"
      ? `${completedSteps[1]} of ${completedSteps[2]} steps completed`
      : `${completedSteps[1]} de ${completedSteps[2]} etapas completadas`;
  }

  const currentStepCount = value.match(/^(.+) de (\d+) etapas concluídas$/);
  if (currentStepCount) {
    const step = language === "ja-JP"
      ? japaneseTranslations[currentStepCount[1]] || currentStepCount[1]
      : translations[currentStepCount[1]]?.[language] || currentStepCount[1];
    if (language === "ja-JP") return `${step}: ${currentStepCount[2]} ステップ完了`;
    return language === "en-US"
      ? `${step}: ${currentStepCount[2]} steps completed`
      : `${step}: ${currentStepCount[2]} etapas completadas`;
  }

  const vehicleNotice = value.match(/^Seu (.+) está na etapa: (.+)\.$/);
  if (vehicleNotice) {
    const step = language === "ja-JP"
      ? japaneseTranslations[vehicleNotice[2]] || vehicleNotice[2]
      : translations[vehicleNotice[2]]?.[language] || vehicleNotice[2];
    if (language === "ja-JP") return `${vehicleNotice[1]}の現在の段階: ${step}。`;
    return language === "en-US"
      ? `Your ${vehicleNotice[1]} is at this stage: ${step}.`
      : `Tu ${vehicleNotice[1]} está en la etapa: ${step}.`;
  }

  const remainingPayments = value.match(/^Você possui (\d+) parcela\(s\) restante\(s\)\.$/);
  if (remainingPayments) {
    if (language === "ja-JP") return `残り${remainingPayments[1]}回のお支払いです。`;
    return language === "en-US"
      ? `You have ${remainingPayments[1]} installment(s) remaining.`
      : `Te quedan ${remainingPayments[1]} cuota(s).`;
  }

  const warranty = value.match(/^Garantia: (.+)\.$/);
  if (warranty) {
    const label = language === "en-US" ? "Warranty" : language === "ja-JP" ? "保証" : "Garantía";
    return `${label}: ${warranty[1]}.`;
  }

  const financingStatus = value.match(/^Financiamento: (.+)$/);
  if (financingStatus) {
    const label = language === "en-US" ? "Financing" : language === "ja-JP" ? "ローン" : "Financiación";
    return `${label}: ${financingStatus[1]}`;
  }

  const selectedPayment = value.match(/^Pagamento selecionado: (.+)$/);
  if (selectedPayment) {
    const label = language === "en-US" ? "Selected payment method" : language === "ja-JP" ? "選択したお支払い方法" : "Método de pago seleccionado";
    return `${label}: ${selectedPayment[1]}`;
  }

  const purchaseOrder = value.match(/^Pedido #(\d+)$/);
  if (purchaseOrder) {
    const label = language === "en-US" ? "Order" : language === "ja-JP" ? "注文番号" : "Pedido n.º";
    return `${label} ${purchaseOrder[1]}`;
  }

  const lastPaidMonth = value.match(/^Último mês pago: (.+)$/);
  if (lastPaidMonth) {
    const prefix = language === "en-US" ? "Last month paid" : language === "ja-JP" ? "前回のお支払い月" : "Último mes pagado";
    const month = language === "ja-JP"
      ? japaneseTranslations[lastPaidMonth[1]] || lastPaidMonth[1]
      : translations[lastPaidMonth[1]]?.[language] || lastPaidMonth[1];
    return `${prefix}: ${month}`;
  }

  const addedProduct = value.match(/^(.+) adicionado ao carrinho!$/);
  if (addedProduct) {
    const product = translations[addedProduct[1]]?.[language] || addedProduct[1];
    if (language === "ja-JP") return `${product}をカートに追加しました。`;
    return language === "en-US" ? `${product} added to cart!` : `¡${product} añadido al carrito!`;
  }

  return undefined;
}

function translate(value: string, language: Language) {
  // JSX line wrapping should not prevent a sentence from matching its dictionary key.
  const normalized = value.replace(/\s+/g, " ").trim();
  const directSource =
    Object.prototype.hasOwnProperty.call(translations, value)
    || Object.prototype.hasOwnProperty.call(japaneseTranslations, value)
    || Object.prototype.hasOwnProperty.call(translations, normalized)
    || Object.prototype.hasOwnProperty.call(japaneseTranslations, normalized);
  const source = directSource ? (Object.prototype.hasOwnProperty.call(translations, value)
    || Object.prototype.hasOwnProperty.call(japaneseTranslations, value) ? value : normalized)
    : reverse[value] || reverse[normalized] || normalized;
  const result = language === "pt-BR"
    ? portugueseOverrides[source] || source
    : language === "ja-JP"
      ? japaneseTranslations[source] ?? translateDynamic(source, language)
      : translations[source]?.[language] ?? translateDynamic(source, language);
  if (result === undefined || result === null) return value;
  if (normalized === value) return result;
  const leadingWhitespace = value.match(/^\s*/)?.[0] || "";
  const trailingWhitespace = value.match(/\s*$/)?.[0] || "";
  return `${leadingWhitespace}${result}${trailingWhitespace}`;
}

function translateTextNode(node: Text, language: Language) {
  const current = node.nodeValue || "";
  const previousTranslation = translatedText.get(node);

  if (!originalText.has(node) || current !== previousTranslation) {
    originalText.set(node, current);
  }

  const translated = translate(originalText.get(node) || current, language);
  if (translated !== current) node.nodeValue = translated;
  translatedText.set(node, translated);
}

export default function PageTranslation() {
  const { language } = useLanguage();

  useEffect(() => {
    const translateTree = (root: Node) => {
      if (root instanceof Text) {
        translateTextNode(root, language);
        return;
      }
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      const nodes: Text[] = [];
      while (walker.nextNode()) nodes.push(walker.currentNode as Text);
      nodes.forEach((node) => {
        if (node.parentElement?.closest("script, style")) return;
        translateTextNode(node, language);
      });
      if (root instanceof Element) {
        const attributeSelector = [
          "[placeholder]", "[title]", "[aria-label]", "[aria-description]",
          "[alt]", "[data-tooltip]", "input[type='submit'][value]",
          "input[type='button'][value]", "input[type='reset'][value]",
        ].join(", ");
        const elements: HTMLElement[] = [];
        if (root.matches?.(attributeSelector)) elements.push(root as HTMLElement);
        elements.push(...Array.from(root.querySelectorAll<HTMLElement>(attributeSelector)));

        elements.forEach((element) => {
          ["placeholder", "title", "aria-label", "aria-description", "alt", "data-tooltip"].forEach((attribute) => {
            if (element.hasAttribute(attribute)) translateAttribute(element, attribute, language);
          });
          if (element instanceof HTMLInputElement && ["submit", "button", "reset"].includes(element.type)) {
            translateAttribute(element, "value", language);
          }
        });
      }
    };

    translateTree(document.body);
    const observer = new MutationObserver((mutations) => mutations.forEach((mutation) => {
      if (mutation.type === "characterData" || mutation.type === "attributes") {
        translateTree(mutation.target);
        return;
      }
      mutation.addedNodes.forEach(translateTree);
    }));
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: [
        "placeholder",
        "title",
        "aria-label",
        "aria-description",
        "alt",
        "data-tooltip",
        "value",
      ],
    });
    return () => observer.disconnect();
  }, [language]);

  return null;
}

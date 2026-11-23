package br.com.toyota.toyota_backend.config;

import br.com.toyota.toyota_backend.models.PerfilUsuario;
import br.com.toyota.toyota_backend.models.UsuarioInterno;
import br.com.toyota.toyota_backend.repositories.UsuarioInternoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;

/**
 * Cria os usuários internos padrão (admin e vendedor) quando ainda não existem.
 *
 * Segurança: a senha não fica mais fixa no código. Ela vem das variáveis de
 * ambiente ADMIN_SEED_SENHA e VENDEDOR_SEED_SENHA e é gravada com hash BCrypt.
 * Sem a variável, o usuário padrão não é criado.
 */
@Configuration
public class UsuarioInternoSeedConfig {

    private static final Logger log = LoggerFactory.getLogger(UsuarioInternoSeedConfig.class);

    @Value("${app.seed.admin-senha:}")
    private String adminSenha;

    @Value("${app.seed.vendedor-senha:}")
    private String vendedorSenha;

    @Bean
    CommandLineRunner criarUsuariosInternosPadrao(
            UsuarioInternoRepository repository,
            PasswordEncoder passwordEncoder
    ) {
        return args -> {
            criarUsuarioSeNaoExistir(
                    repository,
                    passwordEncoder,
                    "Administrador Toyota",
                    "adm@toyota.com",
                    adminSenha,
                    PerfilUsuario.ADMIN
            );

            criarUsuarioSeNaoExistir(
                    repository,
                    passwordEncoder,
                    "Vendedor Toyota",
                    "vendedor@toyota.com",
                    vendedorSenha,
                    PerfilUsuario.VENDEDOR
            );
        };
    }

    private void criarUsuarioSeNaoExistir(
            UsuarioInternoRepository repository,
            PasswordEncoder passwordEncoder,
            String nome,
            String email,
            String senha,
            PerfilUsuario perfil
    ) {
        String emailNormalizado = email.trim().toLowerCase();

        if (repository.existsByEmail(emailNormalizado)) {
            return;
        }

        if (senha == null || senha.isBlank()) {
            log.warn("Usuário padrão {} não criado: defina a variável de ambiente da senha "
                    + "(ADMIN_SEED_SENHA ou VENDEDOR_SEED_SENHA).", emailNormalizado);
            return;
        }

        UsuarioInterno usuario = new UsuarioInterno();
        usuario.setNome(nome);
        usuario.setEmail(emailNormalizado);
        usuario.setSenha(passwordEncoder.encode(senha));
        usuario.setPerfil(perfil);
        usuario.setAtivo(true);
        usuario.setCreatedAt(LocalDate.now());

        repository.save(usuario);
    }
}

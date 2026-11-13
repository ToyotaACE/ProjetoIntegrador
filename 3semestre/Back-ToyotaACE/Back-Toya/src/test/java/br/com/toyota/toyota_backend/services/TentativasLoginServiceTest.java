package br.com.toyota.toyota_backend.services;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.*;

class TentativasLoginServiceTest {

    private static final String CHAVE = "cliente:teste@teste.com";

    private static void falhar(TentativasLoginService service, String chave, int vezes) {
        for (int i = 0; i < vezes; i++) {
            service.verificarBloqueio(chave);
            service.registrarFalha(chave);
        }
    }

    @Test
    void naoBloqueiaComMenosDeCincoFalhas() {
        TentativasLoginService service = new TentativasLoginService();

        falhar(service, CHAVE, 4);

        assertDoesNotThrow(() -> service.verificarBloqueio(CHAVE));
    }

    @Test
    void bloqueiaComHttp429AposCincoFalhas() {
        TentativasLoginService service = new TentativasLoginService();

        falhar(service, CHAVE, 5);

        ResponseStatusException erro = assertThrows(
                ResponseStatusException.class,
                () -> service.verificarBloqueio(CHAVE)
        );
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, erro.getStatusCode());
    }

    @Test
    void loginComSucessoZeraOContador() {
        TentativasLoginService service = new TentativasLoginService();

        falhar(service, CHAVE, 4);
        service.registrarSucesso(CHAVE);
        falhar(service, CHAVE, 4);

        assertDoesNotThrow(() -> service.verificarBloqueio(CHAVE));
    }

    @Test
    void bloqueioDeUmaContaNaoAfetaOutra() {
        TentativasLoginService service = new TentativasLoginService();

        falhar(service, CHAVE, 5);

        assertDoesNotThrow(() -> service.verificarBloqueio("cliente:outra@teste.com"));
        assertDoesNotThrow(() -> service.verificarBloqueio("usuario:teste@teste.com"));
    }
}

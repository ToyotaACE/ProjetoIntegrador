package br.com.toyota.toyota_backend.services;

import br.com.toyota.toyota_backend.models.ClienteSession;
import br.com.toyota.toyota_backend.repositories.ClienteRepository;
import br.com.toyota.toyota_backend.repositories.ClienteSessionRepository;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class ClienteSessionServiceTest {
    @Test
    void issuesOpaqueBearerTokenAndAuthenticatesItsPersistedHash() {
        ClienteSessionRepository sessions = mock(ClienteSessionRepository.class);
        ClienteRepository clients = mock(ClienteRepository.class);
        when(sessions.save(any(ClienteSession.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(clients.existsById(23L)).thenReturn(true);
        ClienteSessionService service = new ClienteSessionService(sessions, clients);

        String token = service.criarToken(23L);

        var captor = org.mockito.ArgumentCaptor.forClass(ClienteSession.class);
        verify(sessions).save(captor.capture());
        ClienteSession stored = captor.getValue();
        assertNotEquals(token, stored.getTokenHash());
        assertEquals(64, stored.getTokenHash().length());
        assertTrue(stored.getExpiresAt().isAfter(Instant.now()));
        when(sessions.findByTokenHashAndExpiresAtAfter(eq(stored.getTokenHash()), any(Instant.class)))
                .thenReturn(Optional.of(stored));

        assertEquals(23L, service.autenticar("Bearer " + token));
    }

    @Test
    void rejectsMissingBearerToken() {
        ClienteSessionService service = new ClienteSessionService(
                mock(ClienteSessionRepository.class),
                mock(ClienteRepository.class)
        );

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> service.autenticar(null)
        );
        assertEquals(HttpStatus.UNAUTHORIZED, error.getStatusCode());
    }
}

package br.com.toyota.toyota_backend.services;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.*;

class IoTServiceTest {

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {
            "x\" or r[\"vin\"] != \"",
            "ABC\") |> yield() //",
            "ABC 123",
            "ABC-123",
            "../etc/passwd",
            "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" // 41 caracteres
    })
    void rejeitaVinInvalidoAntesDeConsultarOInfluxDb(String vin) {
        // Sem cliente do InfluxDB: se a validação deixasse passar, o teste falharia
        // com NullPointerException em vez de ResponseStatusException.
        IoTService service = new IoTService();

        ResponseStatusException erro = assertThrows(
                ResponseStatusException.class,
                () -> service.buscarEtapas(vin)
        );
        assertEquals(HttpStatus.BAD_REQUEST, erro.getStatusCode());
    }
}

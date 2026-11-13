package br.com.toyota.toyota_backend.services;

import com.influxdb.client.InfluxDBClient;
import com.influxdb.client.QueryApi;
import com.influxdb.query.FluxRecord;
import com.influxdb.query.FluxTable;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class IoTService {

    // Segurança: o VIN/chassi só pode ter letras e números,
    // impedindo injeção na consulta Flux (InfluxDB)
    private static final Pattern VIN_PATTERN = Pattern.compile("^[A-Za-z0-9]{1,40}$");

    @Autowired
    private InfluxDBClient influxDBClient;

    public List<String> buscarEtapas(final String vin) {

        if (vin == null || !VIN_PATTERN.matcher(vin).matches()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "VIN inválido. Use apenas letras e números."
            );
        }

        final String flux = """
            from(bucket: "toyota_ace")
              |> range(start: -30d)
              |> filter(fn: (r) => r["vin"] == "%s")
            """.formatted(vin);

        QueryApi queryApi = influxDBClient.getQueryApi();

        List<FluxTable> tables = queryApi.query(flux);

        List<String> etapas = new ArrayList<>();

        for (FluxTable table : tables) {

            for (FluxRecord record : table.getRecords()) {

                Object etapa = record.getValueByKey("etapa");

                if (etapa != null) {
                    etapas.add(etapa.toString());
                }
            }
        }

        return etapas;
    }
}
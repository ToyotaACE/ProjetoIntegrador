package br.com.toyota.toyota_backend.services;

import br.com.toyota.toyota_backend.models.Veiculo;
import br.com.toyota.toyota_backend.repositories.VeiculoRepository;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;

import org.eclipse.paho.client.mqttv3.MqttClient;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

@Service
public class MqttConsumerService {

    private final VeiculoRepository veiculoRepository;
    private final ObjectMapper objectMapper;

    private MqttClient client;

    public MqttConsumerService(
            VeiculoRepository veiculoRepository,
            ObjectMapper objectMapper
    ) {
        this.veiculoRepository = veiculoRepository;
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void start() {

        try {

            client = new MqttClient(
                    "tcp://mqtt:1883",
                    MqttClient.generateClientId()
            );

            client.connect();

            System.out.println("CONECTADO MQTT");

            client.subscribe("toyota/veiculo/status", (topic, msg) -> {

                try {

                    String payload = new String(
                            msg.getPayload(),
                            StandardCharsets.UTF_8
                    );

                    System.out.println(
                            "MQTT RECEBIDO: " + payload
                    );

                    JsonNode json = objectMapper.readTree(payload);

                    JsonNode chassiNode = json.get("chassi");
                    JsonNode etapaNode = json.get("etapa");
                    JsonNode statusNode = json.get("status");
                    JsonNode progressoNode = json.get("progresso");

                    if (chassiNode == null || etapaNode == null) {

                        System.out.println(
                                "MENSAGEM MQTT INVÁLIDA: " +
                                "chassi ou etapa não encontrados."
                        );

                        return;
                    }

                    String chassi = chassiNode.asText();
                    String etapa = etapaNode.asText();

                    String status = statusNode != null
                            ? statusNode.asText()
                            : "";

                    Integer progresso;

                    if (
                            progressoNode != null
                                    && !progressoNode.isNull()
                    ) {

                        progresso = progressoNode.asInt();

                    } else {

                        progresso = calcularProgressoPorEtapa(etapa);
                    }

                    Veiculo veiculo = veiculoRepository
                            .findByChassiVeiculo(chassi)
                            .orElse(null);

                    if (veiculo == null) {

                        System.out.println(
                                "VEÍCULO NÃO ENCONTRADO PARA O CHASSI: "
                                        + chassi
                        );

                        return;
                    }

                    veiculo.setStatusVeiculo(etapa);
                    veiculo.setProgressoVeiculo(progresso);

                    veiculoRepository.save(veiculo);

                    System.out.println(
                            "VEÍCULO ATUALIZADO VIA MQTT"
                    );

                    System.out.println(
                            "Chassi: " + chassi
                    );

                    System.out.println(
                            "Etapa: " + etapa
                    );

                    System.out.println(
                            "Status recebido: " + status
                    );

                    System.out.println(
                            "Progresso calculado: "
                                    + progresso
                                    + "%"
                    );

                } catch (Exception e) {

                    System.out.println(
                            "ERRO AO PROCESSAR MENSAGEM MQTT:"
                    );

                    e.printStackTrace();
                }
            });

            System.out.println(
                    "MQTT CONSUMER INSCRITO NO TÓPICO: "
                            + "toyota/veiculo/status"
            );

        } catch (Exception e) {

            System.out.println(
                    "ERRO AO CONECTAR MQTT:"
            );

            e.printStackTrace();
        }
    }

    @PreDestroy
    public void stop() {

        if (client == null) {
            return;
        }

        try {

            if (client.isConnected()) {
                client.disconnect();
            }

        } catch (Exception e) {

            System.out.println(
                    "ERRO AO DESCONECTAR MQTT:"
            );

            e.printStackTrace();

        } finally {

            try {

                client.close();

                System.out.println(
                        "CONEXÃO MQTT ENCERRADA"
                );

            } catch (Exception e) {

                System.out.println(
                        "ERRO AO FECHAR CLIENT MQTT:"
                );

                e.printStackTrace();
            }
        }
    }

    private Integer calcularProgressoPorEtapa(String etapa) {

        String etapaNormalizada = normalizar(etapa);

        if (etapaNormalizada.contains("pedido")) {
            return 17;
        }

        if (
                etapaNormalizada.contains("producao")
                        || etapaNormalizada.contains("linha")
        ) {
            return 33;
        }

        if (etapaNormalizada.contains("inspecao")) {
            return 50;
        }

        if (etapaNormalizada.contains("cegonha")) {
            return 67;
        }

        if (etapaNormalizada.contains("concessionaria")) {
            return 83;
        }

        if (
                etapaNormalizada.contains("pronto")
                        || etapaNormalizada.contains("retirada")
        ) {
            return 100;
        }

        return 0;
    }

    private String normalizar(String texto) {

        if (texto == null) {
            return "";
        }

        return texto
                .toLowerCase()
                .replace("ç", "c")
                .replace("ã", "a")
                .replace("á", "a")
                .replace("à", "a")
                .replace("â", "a")
                .replace("é", "e")
                .replace("ê", "e")
                .replace("í", "i")
                .replace("ó", "o")
                .replace("ô", "o")
                .replace("õ", "o")
                .replace("ú", "u");
    }
}
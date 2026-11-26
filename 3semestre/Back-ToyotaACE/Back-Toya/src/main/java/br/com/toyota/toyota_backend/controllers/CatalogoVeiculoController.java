package br.com.toyota.toyota_backend.controllers;

import br.com.toyota.toyota_backend.dto.CatalogoVeiculoRequest;
import br.com.toyota.toyota_backend.dto.CatalogoVeiculoResponse;
import br.com.toyota.toyota_backend.models.CatalogoVeiculo;
import br.com.toyota.toyota_backend.models.CorCatalogoVeiculo;
import br.com.toyota.toyota_backend.models.OpcionalCatalogoVeiculo;
import br.com.toyota.toyota_backend.models.VersaoCatalogoVeiculo;
import br.com.toyota.toyota_backend.repositories.CatalogoVeiculoRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@RestController
@RequestMapping("/api/catalogo-veiculos")
@CrossOrigin(origins = "*")
public class CatalogoVeiculoController {
    private static final Set<String> CATEGORIAS = Set.of("SUV", "Sedan", "Hatch", "Picape");
    private static final int MAX_IMAGE_BYTES = 3 * 1024 * 1024;
    private final CatalogoVeiculoRepository repository;

    public CatalogoVeiculoController(CatalogoVeiculoRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ResponseEntity<List<CatalogoVeiculoResponse>> listar() {
        return ResponseEntity.ok(repository.findAllByOrderByModeloAsc().stream()
                .map(this::toResponse)
                .toList());
    }

    @PostMapping
    public ResponseEntity<CatalogoVeiculoResponse> criar(
            @RequestBody CatalogoVeiculoRequest request
    ) {
        validar(request);

        CatalogoVeiculo vehicle = new CatalogoVeiculo();
        vehicle.setModelo(request.modelo().trim());
        vehicle.setCategoria(request.categoria().trim());
        vehicle.setAno(request.ano());
        vehicle.setPrecoBase(request.precoBase());
        vehicle.setMotor(request.motor().trim());
        vehicle.setCombustivel(request.combustivel().trim());
        vehicle.setCambio(request.cambio().trim());
        vehicle.setFotoCarroUrl(request.fotoCarroUrl());
        vehicle.setVersoes(request.versoes().stream()
                .map(version -> {
                    VersaoCatalogoVeiculo result = new VersaoCatalogoVeiculo();
                    result.setNome(version.nome().trim());
                    result.setMotor(version.motor().trim());
                    result.setPreco(version.preco());
                    return result;
                }).toList());
        vehicle.setCores(request.cores().stream()
                .map(color -> {
                    CorCatalogoVeiculo result = new CorCatalogoVeiculo();
                    result.setNome(color.nome().trim());
                    result.setHexadecimal(color.hexadecimal().toUpperCase(Locale.ROOT));
                    return result;
                }).toList());
        vehicle.setOpcionais(request.opcionais().stream()
                .map(option -> {
                    OpcionalCatalogoVeiculo result = new OpcionalCatalogoVeiculo();
                    result.setNome(option.nome().trim());
                    result.setPreco(option.preco());
                    return result;
                }).toList());

        CatalogoVeiculo saved = repository.save(vehicle);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(saved));
    }

    private void validar(CatalogoVeiculoRequest request) {
        if (request == null) {
            throw invalid("Informe os dados do veículo.");
        }
        requireText(request.modelo(), 100, "Informe um modelo com até 100 caracteres.");
        requireText(request.categoria(), 40, "Informe uma categoria válida.");
        if (!CATEGORIAS.contains(request.categoria().trim())) {
            throw invalid("A categoria deve ser SUV, Sedan, Hatch ou Picape.");
        }
        if (request.ano() == null || request.ano() < 1900 || request.ano() > 2100) {
            throw invalid("Informe um ano válido.");
        }
        if (request.precoBase() == null || request.precoBase().signum() <= 0) {
            throw invalid("O preço base deve ser maior que zero.");
        }
        requireText(request.motor(), 100, "Informe a motorização.");
        requireText(request.combustivel(), 50, "Informe o combustível.");
        requireText(request.cambio(), 80, "Informe o câmbio.");
        validarImagem(request.fotoCarroUrl());

        if (request.versoes() == null || request.versoes().isEmpty() || request.versoes().size() > 20) {
            throw invalid("Cadastre de 1 a 20 versões.");
        }
        for (CatalogoVeiculoRequest.Versao version : request.versoes()) {
            if (version == null) {
                throw invalid("Há uma versão inválida.");
            }
            requireText(version.nome(), 80, "Cada versão precisa de um nome.");
            requireText(version.motor(), 100, "Cada versão precisa de uma motorização.");
            if (version.preco() == null || version.preco().signum() <= 0) {
                throw invalid("O preço de cada versão deve ser maior que zero.");
            }
        }

        if (request.cores() == null || request.cores().isEmpty() || request.cores().size() > 30) {
            throw invalid("Cadastre de 1 a 30 cores.");
        }
        for (CatalogoVeiculoRequest.Cor color : request.cores()) {
            if (color == null) {
                throw invalid("Há uma cor inválida.");
            }
            requireText(color.nome(), 50, "Cada cor precisa de um nome.");
            if (color.hexadecimal() == null || !color.hexadecimal().matches("#[0-9a-fA-F]{6}")) {
                throw invalid("Use um código de cor no formato #RRGGBB.");
            }
        }

        if (request.opcionais() == null || request.opcionais().size() > 50) {
            throw invalid("Cadastre até 50 opcionais.");
        }
        for (CatalogoVeiculoRequest.Opcional option : request.opcionais()) {
            if (option == null) {
                throw invalid("Há um opcional inválido.");
            }
            requireText(option.nome(), 100, "Cada opcional precisa de um nome.");
            if (option.preco() == null || option.preco().signum() < 0) {
                throw invalid("O preço de cada opcional não pode ser negativo.");
            }
        }
    }

    private void validarImagem(String image) {
        if (image == null || image.length() > 4_200_000) {
            throw invalid("Selecione uma imagem de até 3 MB.");
        }

        int comma = image.indexOf(',');
        if (comma < 0) {
            throw invalid("A imagem selecionada é inválida.");
        }

        String header = image.substring(0, comma).toLowerCase(Locale.ROOT);
        if (!Set.of("data:image/png;base64", "data:image/jpeg;base64", "data:image/webp;base64")
                .contains(header)) {
            throw invalid("Use uma imagem PNG, JPEG ou WebP.");
        }

        byte[] content;
        try {
            content = Base64.getDecoder().decode(image.substring(comma + 1));
        } catch (IllegalArgumentException exception) {
            throw invalid("A imagem selecionada é inválida.");
        }
        if (content.length == 0 || content.length > MAX_IMAGE_BYTES || !matchesImageType(header, content)) {
            throw invalid("Selecione uma imagem PNG, JPEG ou WebP de até 3 MB.");
        }
    }

    private boolean matchesImageType(String header, byte[] content) {
        if (header.contains("png")) {
            return content.length >= 8 && content[0] == (byte) 0x89
                    && content[1] == 0x50 && content[2] == 0x4E && content[3] == 0x47;
        }
        if (header.contains("jpeg")) {
            return content.length >= 3 && content[0] == (byte) 0xFF
                    && content[1] == (byte) 0xD8 && content[2] == (byte) 0xFF;
        }
        return content.length >= 12 && content[0] == 0x52 && content[1] == 0x49
                && content[2] == 0x46 && content[3] == 0x46
                && content[8] == 0x57 && content[9] == 0x45
                && content[10] == 0x42 && content[11] == 0x50;
    }

    private void requireText(String value, int maxLength, String message) {
        if (value == null || value.isBlank() || value.trim().length() > maxLength) {
            throw invalid(message);
        }
    }

    private ResponseStatusException invalid(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    private CatalogoVeiculoResponse toResponse(CatalogoVeiculo vehicle) {
        return new CatalogoVeiculoResponse(
                vehicle.getId(),
                vehicle.getModelo(),
                vehicle.getCategoria(),
                vehicle.getAno(),
                vehicle.getPrecoBase(),
                vehicle.getMotor(),
                vehicle.getCombustivel(),
                vehicle.getCambio(),
                vehicle.getFotoCarroUrl(),
                vehicle.getVersoes().stream()
                        .map(version -> new CatalogoVeiculoResponse.Versao(
                                version.getNome(), version.getMotor(), version.getPreco()))
                        .toList(),
                vehicle.getCores().stream()
                        .map(color -> new CatalogoVeiculoResponse.Cor(
                                color.getNome(), color.getHexadecimal()))
                        .toList(),
                vehicle.getOpcionais().stream()
                        .map(option -> new CatalogoVeiculoResponse.Opcional(
                                option.getNome(), option.getPreco()))
                        .toList()
        );
    }
}

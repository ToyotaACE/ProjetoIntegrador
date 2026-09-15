package br.com.toyota.toyota_backend.controllers;

import br.com.toyota.toyota_backend.services.IoTService;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/iot")
public class IoTController {

    private final IoTService ioTService;

    public IoTController(IoTService ioTService) {
        this.ioTService = ioTService;
    }

    @GetMapping("/status/{vin}")
    public List<String> buscarStatus(@PathVariable String vin) {
        return ioTService.buscarEtapas(vin);
    }
}
package br.com.toyota.toyota_backend.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public class AgendamentoDisponibilidade {
	private LocalDate data;
	private LocalTime horario;

	public AgendamentoDisponibilidade(LocalDate data, LocalTime horario) {
		this.data = data;
		this.horario = horario;
	}

	public LocalDate getData() {
		return data;
	}

	public LocalTime getHorario() {
		return horario;
	}
}
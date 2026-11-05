/**
 * Regra de negocio: o predio/equipamentos da FANS so podem ser reservados
 * dentro do horario de aula do periodo noturno: 18:50 as 22:25, no horario
 * de Brasilia.
 *
 * NOTA DE IMPLEMENTACAO: o calculo abaixo usa um deslocamento fixo de -03:00
 * (horario de Brasilia, sem horario de verao desde 2019) em vez do fuso
 * horario local do servidor, para funcionar corretamente mesmo quando a API
 * for hospedada em um servidor configurado em UTC.
 */
const OFFSET_BRASILIA_HORAS = 3;

const HORA_INICIO_AULA = { hora: 18, minuto: 50 };
const HORA_FIM_AULA = { hora: 22, minuto: 25 };

function minutosDoDia({ hora, minuto }) {
  return hora * 60 + minuto;
}

const LIMITE_INICIO_MIN = minutosDoDia(HORA_INICIO_AULA);
const LIMITE_FIM_MIN = minutosDoDia(HORA_FIM_AULA);

function paraBrasilia(data) {
  const deslocado = new Date(data.getTime() - OFFSET_BRASILIA_HORAS * 60 * 60 * 1000);
  return {
    ano: deslocado.getUTCFullYear(),
    mes: deslocado.getUTCMonth(),
    dia: deslocado.getUTCDate(),
    minutosDoDia: deslocado.getUTCHours() * 60 + deslocado.getUTCMinutes(),
  };
}

function validarHorarioDeAula(dataInicio, dataFim) {
  const ini = paraBrasilia(dataInicio);
  const fimParts = paraBrasilia(dataFim);

  const mesmoDia = ini.ano === fimParts.ano && ini.mes === fimParts.mes && ini.dia === fimParts.dia;
  if (!mesmoDia) {
    return "O horário de início e devolução devem estar no mesmo dia. Para reservar vários dias, use a reserva por período de aulas.";
  }
  if (ini.minutosDoDia < LIMITE_INICIO_MIN || ini.minutosDoDia > LIMITE_FIM_MIN) {
    return "O horário de início deve estar entre 18:50 e 22:25 (horário de aula).";
  }
  if (fimParts.minutosDoDia < LIMITE_INICIO_MIN || fimParts.minutosDoDia > LIMITE_FIM_MIN) {
    return "O horário de devolução deve estar entre 18:50 e 22:25 (horário de aula).";
  }
  return null;
}

function slotDoDia(diaBase) {
  const ano = diaBase.getUTCFullYear();
  const mes = diaBase.getUTCMonth();
  const dia = diaBase.getUTCDate();
  const inicio = new Date(Date.UTC(ano, mes, dia, HORA_INICIO_AULA.hora + OFFSET_BRASILIA_HORAS, HORA_INICIO_AULA.minuto));
  const fim = new Date(Date.UTC(ano, mes, dia, HORA_FIM_AULA.hora + OFFSET_BRASILIA_HORAS, HORA_FIM_AULA.minuto));
  return { inicio, fim };
}

function listarDias(dataInicial, dataFinal) {
  const dias = [];
  let atualMs = Date.UTC(dataInicial.getUTCFullYear(), dataInicial.getUTCMonth(), dataInicial.getUTCDate());
  const fimMs = Date.UTC(dataFinal.getUTCFullYear(), dataFinal.getUTCMonth(), dataFinal.getUTCDate());
  while (atualMs <= fimMs) {
    dias.push(new Date(atualMs));
    atualMs += 24 * 60 * 60 * 1000;
  }
  return dias;
}

module.exports = { HORA_INICIO_AULA, HORA_FIM_AULA, validarHorarioDeAula, slotDoDia, listarDias };

// Define os botões de mensagem rápida e como o texto muda de acordo com o horário.

export function getPeriod(date = new Date()) {
  const h = date.getHours();
  if (h >= 5 && h < 12) return 'manha';
  if (h >= 12 && h < 18) return 'tarde';
  if (h >= 18 && h < 23) return 'noite';
  return 'madrugada';
}

// Cada tipo de botão tem uma frase e emoji que varia com o período do dia.
export const QUICK_MESSAGES = {
  sol: {
    label: 'Bom dia',
    icon: 'sun',
    phrases: {
      manha: 'Bom dia, meu amor! ☀️',
      tarde: 'Boa tarde! Passando pra dizer bom dia com atraso 😄',
      noite: 'Já é noite, mas bom dia do fundo do coração 🌇',
      madrugada: 'Ainda de madrugada, mas já pensando em você ☀️'
    }
  },
  coracao: {
    label: 'Te amo',
    icon: 'heart',
    phrases: {
      manha: 'Bom dia! Te amo 💛',
      tarde: 'Só passando pra dizer que te amo 💛',
      noite: 'Boa noite, te amo muito 💛',
      madrugada: 'Acordei pensando em você. Te amo 💛'
    }
  },
  lua: {
    label: 'Boa noite',
    icon: 'moon',
    phrases: {
      manha: 'Já com saudade de boa noite 🌙 (adiantado, eu sei)',
      tarde: 'Contando as horas pra boa noite chegar 🌙',
      noite: 'Boa noite, durma bem 🌙',
      madrugada: 'Ainda acordado(a)? Vai dormir, boa noite 🌙'
    }
  },
  saudade: {
    label: 'Saudade',
    icon: 'sparkle',
    phrases: {
      manha: 'Já acordei com saudade seu 💫',
      tarde: 'Tô com saudade no meio do dia 💫',
      noite: 'Termina o dia e a saudade só aumenta 💫',
      madrugada: 'Saudade não escolhe hora 💫'
    }
  }
};

export function phraseFor(type, date = new Date()) {
  const def = QUICK_MESSAGES[type];
  if (!def) return '';
  return def.phrases[getPeriod(date)];
}

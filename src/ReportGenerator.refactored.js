// Valor a partir do qual um item é destacado no relatório de um admin.
const PRIORITY_THRESHOLD = 1000;

// Valor máximo de item que um usuário comum pode ver.
const STANDARD_USER_VALUE_LIMIT = 500;

/**
 * Políticas de acesso por papel do usuário: quais itens ele vê
 * e quais desses itens recebem destaque.
 */
const ROLE_POLICIES = {
  ADMIN: {
    canView: () => true,
    isPriority: (item) => item.value > PRIORITY_THRESHOLD,
  },
  USER: {
    canView: (item) => item.value <= STANDARD_USER_VALUE_LIMIT,
    isPriority: () => false,
  },
};

// Papéis desconhecidos não veem nenhum item.
const NO_ACCESS_POLICY = {
  canView: () => false,
  isPriority: () => false,
};

class CsvFormatter {
  header() {
    return ['ID,NOME,VALOR,USUARIO'];
  }

  row(item, user) {
    return `${item.id},${item.name},${item.value},${user.name}`;
  }

  footer(total) {
    return ['', 'Total,,', `${total},,`];
  }
}

class HtmlFormatter {
  header(user) {
    return [
      '<html><body>',
      '<h1>Relatório</h1>',
      `<h2>Usuário: ${user.name}</h2>`,
      '<table>',
      '<tr><th>ID</th><th>Nome</th><th>Valor</th></tr>',
    ];
  }

  row(item, user, isPriority) {
    const style = isPriority ? ' style="font-weight:bold;"' : '';
    return `<tr${style}><td>${item.id}</td><td>${item.name}</td><td>${item.value}</td></tr>`;
  }

  footer(total) {
    return ['</table>', `<h3>Total: ${total}</h3>`, '</body></html>'];
  }
}

const FORMATTERS = {
  CSV: new CsvFormatter(),
  HTML: new HtmlFormatter(),
};

const sumValues = (items) => items.reduce((total, item) => total + item.value, 0);

export class ReportGenerator {
  constructor(database) {
    this.db = database;
  }

  /**
   * Gera um relatório de itens baseado no tipo e no usuário.
   * - Admins veem tudo.
   * - Users comuns só veem itens com valor <= 500.
   */
  generateReport(reportType, user, items) {
    const formatter = FORMATTERS[reportType];
    if (!formatter) {
      return '';
    }

    const policy = ROLE_POLICIES[user.role] ?? NO_ACCESS_POLICY;
    const visibleItems = items.filter((item) => policy.canView(item));
    const rows = visibleItems.map((item) => formatter.row(item, user, policy.isPriority(item)));

    return [
      ...formatter.header(user),
      ...rows,
      ...formatter.footer(sumValues(visibleItems)),
    ].join('\n');
  }
}

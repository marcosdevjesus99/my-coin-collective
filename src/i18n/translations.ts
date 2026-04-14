export const translations = {
  "pt-BR": {
    // General
    hello: "Olá",
    logout: "Sair",
    save: "Salvar",
    cancel: "Cancelar",
    delete: "Excluir",
    edit: "Editar",
    loading: "Carregando...",
    saving: "Salvando...",
    records: "registros",

    // Dashboard
    monthBalance: "Saldo do mês",
    income: "Entradas",
    expenses: "Saídas",
    transactions: "Movimentações",
    all: "Todas",
    incomeFilter: "Entradas",
    expenseFilter: "Saídas",

    // Transaction Dialog
    newTransaction: "Nova transação",
    editTransaction: "Editar transação",
    editTransactionDesc: "Altere os dados da transação",
    newTransactionDesc: "Registre uma entrada ou saída",
    entryType: "Entrada",
    exitType: "Saída",
    amount: "Valor",
    description: "Descrição",
    descriptionPlaceholder: "Ex: Salário, Aluguel, Mercado...",
    category: "Categoria",
    selectCategory: "Selecione uma categoria",
    date: "Data",
    fixedRecurring: "Fixa / Recorrente",
    installment: "Parcelada",
    currentInstallment: "Parcela atual",
    totalInstallments: "Total parcelas",
    addTransaction: "Adicionar transação",
    saveChanges: "Salvar alterações",
    transactionAdded: "Transação adicionada!",
    transactionUpdated: "Transação atualizada!",
    installmentsCreated: "parcelas criadas automaticamente",

    // Insights
    insights: "Insights",
    topCategory: "Maior gasto",
    expensesByCategory: "Gastos por categoria",
    noData: "Sem dados neste mês",

    // Investments
    investments: "Investimentos",
    newInvestment: "Novo aporte",
    investmentName: "Nome",
    investmentNamePlaceholder: "Ex: Tesouro Selic, CDB...",
    notes: "Observações",
    investmentAdded: "Aporte registrado!",
    investmentDeleted: "Aporte excluído!",
    totalInvested: "Total investido",
    noInvestments: "Nenhum aporte registrado",

    // Categories
    categories: "Categorias",
    manageCategories: "Gerenciar categorias",
    newCategory: "Nova categoria",

    // Profile
    editProfile: "Editar perfil",
    name: "Nome",
    avatarUrl: "URL do avatar",

    // Dark mode
    darkMode: "Modo escuro",
    lightMode: "Modo claro",

    // Months
    months: [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
    ],
  },
  "en-US": {
    hello: "Hello",
    logout: "Logout",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    loading: "Loading...",
    saving: "Saving...",
    records: "records",

    monthBalance: "Month balance",
    income: "Income",
    expenses: "Expenses",
    transactions: "Transactions",
    all: "All",
    incomeFilter: "Income",
    expenseFilter: "Expenses",

    newTransaction: "New transaction",
    editTransaction: "Edit transaction",
    editTransactionDesc: "Change transaction details",
    newTransactionDesc: "Record an income or expense",
    entryType: "Income",
    exitType: "Expense",
    amount: "Amount",
    description: "Description",
    descriptionPlaceholder: "e.g.: Salary, Rent, Groceries...",
    category: "Category",
    selectCategory: "Select a category",
    date: "Date",
    fixedRecurring: "Fixed / Recurring",
    installment: "Installment",
    currentInstallment: "Current installment",
    totalInstallments: "Total installments",
    addTransaction: "Add transaction",
    saveChanges: "Save changes",
    transactionAdded: "Transaction added!",
    transactionUpdated: "Transaction updated!",
    installmentsCreated: "installments created automatically",

    insights: "Insights",
    topCategory: "Top expense",
    expensesByCategory: "Expenses by category",
    noData: "No data this month",

    investments: "Investments",
    newInvestment: "New contribution",
    investmentName: "Name",
    investmentNamePlaceholder: "e.g.: Treasury, Bonds...",
    notes: "Notes",
    investmentAdded: "Contribution recorded!",
    investmentDeleted: "Contribution deleted!",
    totalInvested: "Total invested",
    noInvestments: "No contributions recorded",

    categories: "Categories",
    manageCategories: "Manage categories",
    newCategory: "New category",

    editProfile: "Edit profile",
    name: "Name",
    avatarUrl: "Avatar URL",

    darkMode: "Dark mode",
    lightMode: "Light mode",

    months: [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ],
  },
} as const;

export type Locale = keyof typeof translations;
export type TranslationKey = keyof typeof translations["pt-BR"];

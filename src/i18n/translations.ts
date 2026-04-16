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
    balanceVariation: "vs mês anterior",
    noTransactions: "Nenhuma transação",
    addHint: "Toque no botão + para adicionar",

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
    incomeVsExpenses: "Entradas vs Saídas",

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
    myProfile: "Meu Perfil",
    yourName: "Seu nome",
    photoUrl: "URL da foto",
    saveProfile: "Salvar perfil",
    profileUpdated: "Perfil atualizado!",

    // Dark mode
    darkMode: "Modo escuro",
    lightMode: "Modo claro",

    // Alerts
    alertCategoryDominant: "Você está gastando muito com",
    alertOverspending: "Seus gastos estão maiores que sua renda",
    alertUnusualExpense: "Este gasto está acima do seu padrão",
    alertIncomeConsumed: "Você já consumiu {percent}% da sua renda",
    alertTitle: "Alerta financeiro",

    // Transaction user
    by: "por",
    responsible: "Responsável",
    spendingByUser: "Gastos por usuário",

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
    balanceVariation: "vs last month",
    noTransactions: "No transactions",
    addHint: "Tap the + button to add",

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
    incomeVsExpenses: "Income vs Expenses",

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
    myProfile: "My Profile",
    yourName: "Your name",
    photoUrl: "Photo URL",
    saveProfile: "Save profile",
    profileUpdated: "Profile updated!",

    darkMode: "Dark mode",
    lightMode: "Light mode",

    alertCategoryDominant: "You're spending too much on",
    alertOverspending: "Your expenses exceed your income",
    alertUnusualExpense: "This expense is above your average",
    alertIncomeConsumed: "You've already consumed {percent}% of your income",
    alertTitle: "Financial alert",

    by: "by",
    responsible: "Responsible",
    spendingByUser: "Spending by user",

    months: [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ],
  },
} as const;

export type Locale = keyof typeof translations;
export type TranslationKey = keyof typeof translations["pt-BR"];

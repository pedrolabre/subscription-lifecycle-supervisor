export const DEFAULT_LOCALE = 'pt-BR';

export const LOCALE_VALUES = Object.freeze(['pt-BR', 'en-US']);

export const messages = Object.freeze({
  'pt-BR': {
    app: {
      dashboardLabel: 'Painel de assinaturas',
      headerActionsLabel: 'Preferencias e acao principal',
      localPanel: 'Painel local',
      productName: 'Subscription Lifecycle Supervisor',
      primaryAction: 'Nova assinatura',
    },
    aria: {
      subscriptionsListArea: 'Area da lista de assinaturas',
    },
    billingCycles: {
      lifetime: 'Vitalicio',
      monthly: 'Mensal',
      none: 'Sem cobranca',
      yearly: 'Anual',
    },
    buttons: {
      archive: 'Arquivar',
      cancel: 'Cancelar',
      clear: 'Limpar',
      edit: 'Editar',
      end: 'Encerrar',
      retry: 'Tentar novamente',
      unarchive: 'Desarquivar',
    },
    card: {
      actionArchive: 'Arquivar {name}',
      actionArchiveUnavailable: '{name} ja esta arquivada',
      actionEdit: 'Editar {name}',
      actionEditUnavailable: 'Edicao de {name} indisponivel',
      actionEnd: 'Encerrar {name}',
      actionEndUnavailable: '{name} ja esta encerrada',
      actionUnarchive: 'Desarquivar {name}',
      actionsLabel: 'Acoes de {name}',
      cycleFallback: 'controle local',
      cycleLifetime: 'vitalicio',
      cycleMonthly: '/ mes',
      cycleYearly: '/ ano',
      dateFallback: 'Data',
      fallbackName: 'Assinatura local',
      fallbackStatus: 'Status local',
      noCharge: 'Sem cobranca',
      noLocalDate: 'Sem data local',
      noLocalValue: 'Sem valor local',
      priceFallback: 'Controle local',
      trialEndingSoon: 'Trial perto do fim',
    },
    dates: {
      labels: {
        educationalEnd: 'Termino',
        renewal: 'Renovacao',
        start: 'Inicio',
        status: 'Status',
        trialEnd: 'Fim do trial',
      },
      relative: {
        futureDays: {
          one: 'em {count} dia',
          other: 'em {count} dias',
        },
        pastDays: {
          one: '{count} dia atras',
          other: '{count} dias atras',
        },
        today: 'hoje',
      },
    },
    confirmDialog: {
      archiveConfirm: 'Arquivar',
      archiveMessage: 'Tem certeza que deseja arquivar "{name}"?',
      archiveTitle: 'Arquivar assinatura',
      cancel: 'Cancelar',
      endConfirm: 'Encerrar',
      endMessage: 'Tem certeza que deseja encerrar "{name}"?',
      endTitle: 'Encerrar assinatura',
      unarchiveConfirm: 'Desarquivar',
      unarchiveMessage: 'Tem certeza que deseja desarquivar "{name}"?',
      unarchiveTitle: 'Desarquivar assinatura',
    },
    toast: {
      archived: 'Assinatura "{name}" arquivada.',
      ended: 'Assinatura "{name}" encerrada.',
      unarchived: 'Assinatura "{name}" desarquivada.',
      undo: 'Desfazer',
      undone: 'Arquivamento desfeito.',
    },
    dialog: {
      close: 'Fechar formulario',
      createEyebrow: 'Cadastro local',
      createTitle: 'Nova assinatura',
      editEyebrow: 'Edicao local',
      editTitle: 'Editar assinatura',
    },
    errors: {
      archiveSubscription:
        'Nao foi possivel arquivar a assinatura local.',
      endSubscription: 'Nao foi possivel encerrar a assinatura local.',
      loadSubscriptions: 'Nao foi possivel ler as assinaturas locais.',
      missingSubscriptionId: 'Assinatura local sem identificador.',
      missingSubscriptionIdForEdit:
        'Assinatura local sem identificador para edicao.',
      saveSubscription: 'Nao foi possivel salvar a assinatura local.',
      updateSubscription:
        'Nao foi possivel atualizar a assinatura local.',
    },
    form: {
      accessKinds: {
        educational: 'Educacional',
        free: 'Gratuita',
        paid: 'Paga',
        trial: 'Trial',
      },
      catalog: {
        clearSelection: 'Limpar selecao de {service}',
        freeform: 'Nome livre',
        suggestionsLabel: 'Servicos encontrados',
        useService: 'Usar {service} do catalogo local',
      },
      errors: {
        fixHighlightedFields: 'Revise os campos destacados.',
      },
      fields: {
        billingCycle: 'Ciclo',
        catalog: 'Catalogo',
        educationalEndDate: 'Termino',
        price: 'Valor',
        renewalDate: 'Renovacao',
        serviceName: 'Servico',
        startDate: 'Inicio',
        trialEndDate: 'Fim do trial',
        type: 'Tipo',
      },
      pricePlaceholder: '0,00',
      submitCreate: 'Salvar assinatura',
      submitCreateBusy: 'Salvando',
      submitEdit: 'Salvar edicao',
      submitEditBusy: 'Salvando edicao',
    },
    locale: {
      switchToEnglish: 'Alternar idioma para ingles',
      switchToPortuguese: 'Alternar idioma para portugues',
    },
    states: {
      emptyDescription:
        'Sua lista local ainda nao tem assinaturas. Os dados aparecerao aqui depois do primeiro cadastro.',
      emptyEyebrow: 'Lista local',
      emptyTitle: 'Nenhuma assinatura salva',
      errorEyebrow: 'Leitura local',
      errorTitle: 'Nao foi possivel carregar as assinaturas',
      loadingSubscriptions: 'Carregando assinaturas locais',
    },
    storeStatus: {
      empty: 'Nenhuma assinatura',
      error: 'Leitura local indisponivel',
      idle: 'Preparando leitura local',
      loaded: 'Dados carregados',
      loading: 'Carregando dados locais',
    },
    subscriptionStatus: {
      active: 'Ativa',
      archived: 'Arquivada',
      ended: 'Encerrada',
      trial: 'Trial',
    },
    subscriptionTypes: {
      educational: 'Educacional',
      free: 'Gratuita',
      paid: 'Paga',
    },
    summary: {
      active: {
        detail: 'Status ativo',
        label: 'Ativas',
      },
      archivedDetail: {
        one: '{count} arquivada',
        other: '{count} arquivadas',
      },
      ended: {
        label: 'Encerradas',
      },
      eyebrow: 'Resumo',
      listCount: {
        one: '{count} assinatura carregada',
        other: '{count} assinaturas carregadas',
      },
      monthly: {
        detail: 'Custo normalizado',
        label: 'Mensal',
      },
      subscriptionsEyebrow: 'Assinaturas',
      subscriptionsTitle: 'Lista local',
      title: 'Ciclo atual',
      trialAlertDetailFallback: 'Revise os acessos temporarios.',
      trialAlertSummary: {
        one: '{count} trial perto do vencimento',
        other: '{count} trials perto do vencimento',
      },
      trialAlertsDetail: {
        one: '{count} alerta perto do fim',
        other: '{count} alertas perto do fim',
      },
      trialMoreNames: '{names} e mais {count}',
      trials: {
        label: 'Trials',
      },
      yearly: {
        detail: 'Projecao recorrente',
        label: 'Anual',
      },
    },
    theme: {
      darkTitle: 'Modo escuro',
      lightTitle: 'Modo claro',
      switchToDark: 'Alternar para modo escuro',
      switchToLight: 'Alternar para modo claro',
    },
    validationErrors: {
      billing_cycle_invalid: 'Ciclo de cobranca invalido.',
      brand_color_invalid: 'A cor da marca deve ser hexadecimal.',
      educational_end_date_required:
        'Informe a data de termino do acesso educacional.',
      non_paid_billing_cycle_invalid:
        'Assinaturas gratuitas ou educacionais devem usar ciclo sem cobranca.',
      non_paid_price_invalid:
        'Assinaturas gratuitas ou educacionais devem ter valor zero.',
      paid_billing_cycle_required:
        'Assinaturas pagas devem usar ciclo mensal, anual ou vitalicio.',
      payload_invalid: 'Payload de assinatura invalido.',
      price_invalid: 'O valor da assinatura deve ser numerico.',
      price_negative: 'O valor da assinatura nao pode ser negativo.',
      renewal_date_invalid:
        'A data de renovacao deve estar no formato YYYY-MM-DD.',
      renewal_date_required:
        'Informe a data de renovacao da assinatura.',
      service_name_required: 'Informe o nome do servico.',
      service_name_too_long:
        'O nome do servico deve ter no maximo 40 caracteres.',
      start_date_invalid: 'A data de inicio deve estar no formato YYYY-MM-DD.',
      start_date_required: 'Informe a data de inicio da assinatura.',
      status_invalid: 'Status de assinatura invalido.',
      trial_end_date_invalid:
        'A data de fim do trial deve estar no formato YYYY-MM-DD.',
      trial_end_date_required: 'Informe a data de fim do trial.',
      type_invalid: 'Tipo de assinatura invalido.',
    },
  },
  'en-US': {
    app: {
      dashboardLabel: 'Subscriptions dashboard',
      headerActionsLabel: 'Preferences and primary action',
      localPanel: 'Local panel',
      productName: 'Subscription Lifecycle Supervisor',
      primaryAction: 'New subscription',
    },
    aria: {
      subscriptionsListArea: 'Subscriptions list area',
    },
    billingCycles: {
      lifetime: 'Lifetime',
      monthly: 'Monthly',
      none: 'No billing',
      yearly: 'Yearly',
    },
    buttons: {
      archive: 'Archive',
      cancel: 'Cancel',
      clear: 'Clear',
      edit: 'Edit',
      end: 'End',
      retry: 'Try again',
      unarchive: 'Unarchive',
    },
    card: {
      actionArchive: 'Archive {name}',
      actionArchiveUnavailable: '{name} is already archived',
      actionEdit: 'Edit {name}',
      actionEditUnavailable: 'Edit {name} unavailable',
      actionEnd: 'End {name}',
      actionEndUnavailable: '{name} is already ended',
      actionUnarchive: 'Unarchive {name}',
      actionsLabel: 'Actions for {name}',
      cycleFallback: 'local cycle',
      cycleLifetime: 'lifetime',
      cycleMonthly: '/ month',
      cycleYearly: '/ year',
      dateFallback: 'Date',
      fallbackName: 'Local subscription',
      fallbackStatus: 'Local status',
      noCharge: 'No charge',
      noLocalDate: 'No local date',
      noLocalValue: 'No local value',
      priceFallback: 'Local control',
      trialEndingSoon: 'Trial ending soon',
    },
    dates: {
      labels: {
        educationalEnd: 'End date',
        renewal: 'Renewal',
        start: 'Start',
        status: 'Status',
        trialEnd: 'Trial ends',
      },
      relative: {
        futureDays: {
          one: 'in {count} day',
          other: 'in {count} days',
        },
        pastDays: {
          one: '{count} day ago',
          other: '{count} days ago',
        },
        today: 'today',
      },
    },
    confirmDialog: {
      archiveConfirm: 'Archive',
      archiveMessage: 'Are you sure you want to archive "{name}"?',
      archiveTitle: 'Archive subscription',
      cancel: 'Cancel',
      endConfirm: 'End',
      endMessage: 'Are you sure you want to end "{name}"?',
      endTitle: 'End subscription',
      unarchiveConfirm: 'Unarchive',
      unarchiveMessage: 'Are you sure you want to unarchive "{name}"?',
      unarchiveTitle: 'Unarchive subscription',
    },
    toast: {
      archived: 'Subscription "{name}" archived.',
      ended: 'Subscription "{name}" ended.',
      unarchived: 'Subscription "{name}" unarchived.',
      undo: 'Undo',
      undone: 'Archiving undone.',
    },
    dialog: {
      close: 'Close form',
      createEyebrow: 'Local entry',
      createTitle: 'New subscription',
      editEyebrow: 'Local edit',
      editTitle: 'Edit subscription',
    },
    errors: {
      archiveSubscription: 'Could not archive the local subscription.',
      endSubscription: 'Could not end the local subscription.',
      loadSubscriptions: 'Could not read local subscriptions.',
      missingSubscriptionId: 'Local subscription has no identifier.',
      missingSubscriptionIdForEdit:
        'Local subscription has no identifier for editing.',
      saveSubscription: 'Could not save the local subscription.',
      updateSubscription: 'Could not update the local subscription.',
    },
    form: {
      accessKinds: {
        educational: 'Educational',
        free: 'Free',
        paid: 'Paid',
        trial: 'Trial',
      },
      catalog: {
        clearSelection: 'Clear {service} selection',
        freeform: 'Freeform name',
        suggestionsLabel: 'Matching services',
        useService: 'Use {service} from the local catalog',
      },
      errors: {
        fixHighlightedFields: 'Review the highlighted fields.',
      },
      fields: {
        billingCycle: 'Cycle',
        catalog: 'Catalog',
        educationalEndDate: 'End date',
        price: 'Amount',
        renewalDate: 'Renewal',
        serviceName: 'Service',
        startDate: 'Start',
        trialEndDate: 'Trial ends',
        type: 'Type',
      },
      pricePlaceholder: '0.00',
      submitCreate: 'Save subscription',
      submitCreateBusy: 'Saving',
      submitEdit: 'Save edit',
      submitEditBusy: 'Saving edit',
    },
    locale: {
      switchToEnglish: 'Switch language to English',
      switchToPortuguese: 'Switch language to Portuguese',
    },
    states: {
      emptyDescription:
        'Your local list does not have subscriptions yet. Data will appear here after the first entry.',
      emptyEyebrow: 'Local list',
      emptyTitle: 'No saved subscriptions',
      errorEyebrow: 'Local read',
      errorTitle: 'Could not load subscriptions',
      loadingSubscriptions: 'Loading local subscriptions',
    },
    storeStatus: {
      empty: 'No subscriptions',
      error: 'Local read unavailable',
      idle: 'Preparing local read',
      loaded: 'Data loaded',
      loading: 'Loading local data',
    },
    subscriptionStatus: {
      active: 'Active',
      archived: 'Archived',
      ended: 'Ended',
      trial: 'Trial',
    },
    subscriptionTypes: {
      educational: 'Educational',
      free: 'Free',
      paid: 'Paid',
    },
    summary: {
      active: {
        detail: 'Active status',
        label: 'Active',
      },
      archivedDetail: {
        one: '{count} archived',
        other: '{count} archived',
      },
      ended: {
        label: 'Ended',
      },
      eyebrow: 'Summary',
      listCount: {
        one: '{count} subscription loaded',
        other: '{count} subscriptions loaded',
      },
      monthly: {
        detail: 'Normalized cost',
        label: 'Monthly',
      },
      subscriptionsEyebrow: 'Subscriptions',
      subscriptionsTitle: 'Local list',
      title: 'Current cycle',
      trialAlertDetailFallback: 'Review temporary access.',
      trialAlertSummary: {
        one: '{count} trial near expiration',
        other: '{count} trials near expiration',
      },
      trialAlertsDetail: {
        one: '{count} alert near end',
        other: '{count} alerts near end',
      },
      trialMoreNames: '{names} and {count} more',
      trials: {
        label: 'Trials',
      },
      yearly: {
        detail: 'Recurring projection',
        label: 'Yearly',
      },
    },
    theme: {
      darkTitle: 'Dark mode',
      lightTitle: 'Light mode',
      switchToDark: 'Switch to dark mode',
      switchToLight: 'Switch to light mode',
    },
    validationErrors: {
      billing_cycle_invalid: 'Invalid billing cycle.',
      brand_color_invalid: 'Brand color must be hexadecimal.',
      educational_end_date_required:
        'Enter the educational access end date.',
      non_paid_billing_cycle_invalid:
        'Free or educational subscriptions must use the no-billing cycle.',
      non_paid_price_invalid:
        'Free or educational subscriptions must have zero value.',
      paid_billing_cycle_required:
        'Paid subscriptions must use a monthly, yearly, or lifetime cycle.',
      payload_invalid: 'Invalid subscription payload.',
      price_invalid: 'The subscription amount must be numeric.',
      price_negative: 'The subscription amount cannot be negative.',
      renewal_date_invalid: 'Renewal date must use YYYY-MM-DD format.',
      renewal_date_required: 'Enter the subscription renewal date.',
      service_name_required: 'Enter the service name.',
      service_name_too_long:
        'Service name must have at most 40 characters.',
      start_date_invalid: 'Start date must use YYYY-MM-DD format.',
      start_date_required: 'Enter the subscription start date.',
      status_invalid: 'Invalid subscription status.',
      trial_end_date_invalid: 'Trial end date must use YYYY-MM-DD format.',
      trial_end_date_required: 'Enter the trial end date.',
      type_invalid: 'Invalid subscription type.',
    },
  },
});

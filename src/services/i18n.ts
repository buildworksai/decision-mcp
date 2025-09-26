import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import { join } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

// Supported languages
export const SUPPORTED_LANGUAGES = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  pt: 'Português',
  ru: 'Русский',
  ja: '日本語',
  ko: '한국어',
  zh: '中文'
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

// Translation keys
export const TRANSLATION_KEYS = {
  // Common
  SUCCESS: 'common.success',
  ERROR: 'common.error',
  VALIDATION_FAILED: 'common.validation_failed',
  SESSION_NOT_FOUND: 'common.session_not_found',
  INVALID_INPUT: 'common.invalid_input',
  
  // Sequential Thinking
  THINKING_SESSION_STARTED: 'thinking.session_started',
  THOUGHT_ADDED: 'thinking.thought_added',
  THOUGHT_REVISED: 'thinking.thought_revised',
  BRANCH_CREATED: 'thinking.branch_created',
  SESSION_CONCLUDED: 'thinking.session_concluded',
  
  // Decision Making
  DECISION_SESSION_STARTED: 'decision.session_started',
  CRITERIA_ADDED: 'decision.criteria_added',
  OPTION_ADDED: 'decision.option_added',
  OPTION_EVALUATED: 'decision.option_evaluated',
  RECOMMENDATION_GENERATED: 'decision.recommendation_generated',
  
  // External Data
  EXTERNAL_DATA_FETCHED: 'external.data_fetched',
  DATA_ATTACHED: 'external.data_attached',
  SOURCE_NOT_FOUND: 'external.source_not_found',
  
  // Analysis
  BIAS_DETECTED: 'analysis.bias_detected',
  LOGIC_VALIDATED: 'analysis.logic_validated',
  RISKS_ASSESSED: 'analysis.risks_assessed',
  ALTERNATIVES_GENERATED: 'analysis.alternatives_generated'
} as const;

export class I18nService {
  private currentLanguage: SupportedLanguage = 'en';
  private isInitialized = false;

  async initialize(language: SupportedLanguage = 'en'): Promise<void> {
    if (this.isInitialized) {
      await this.changeLanguage(language);
      return;
    }

    // Ensure locales directory exists
    const localesDir = join(process.cwd(), 'locales');
    if (!existsSync(localesDir)) {
      mkdirSync(localesDir, { recursive: true });
      this.createDefaultTranslations(localesDir);
    }

    await i18next
      .use(Backend)
      .init({
        lng: language,
        fallbackLng: 'en',
        debug: false,
        backend: {
          loadPath: join(localesDir, '{{lng}}.json')
        },
        interpolation: {
          escapeValue: false
        },
        defaultNS: 'translation',
        ns: ['translation']
      });

    this.currentLanguage = language;
    this.isInitialized = true;
  }

  async changeLanguage(language: SupportedLanguage): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize(language);
      return;
    }

    await i18next.changeLanguage(language);
    this.currentLanguage = language;
  }

  getCurrentLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  getSupportedLanguages(): Record<SupportedLanguage, string> {
    return SUPPORTED_LANGUAGES;
  }

  translate(key: string, options?: Record<string, unknown>): string {
    if (!this.isInitialized) {
      return key; // Return key if not initialized
    }
    return i18next.t(key, options);
  }

  translateError(errorKey: string, options?: Record<string, unknown>): string {
    return this.translate(`errors.${errorKey}`, options);
  }

  translateMessage(messageKey: string, options?: Record<string, unknown>): string {
    return this.translate(`messages.${messageKey}`, options);
  }

  // Helper method to get translated validation messages
  getValidationMessage(field: string, error: string, options?: Record<string, unknown>): string {
    return this.translate(`validation.${field}.${error}`, options);
  }

  // Helper method to get translated tool descriptions
  getToolDescription(toolName: string, language?: SupportedLanguage): string {
    const lang = language || this.currentLanguage;
    return this.translate(`tools.${toolName}.description`, { lng: lang });
  }

  private createDefaultTranslations(localesDir: string): void {
    // English translations
    const enTranslations = {
      common: {
        success: 'Success',
        error: 'Error',
        validation_failed: 'Validation failed',
        session_not_found: 'Session not found',
        invalid_input: 'Invalid input provided'
      },
      thinking: {
        session_started: 'Thinking session started successfully',
        thought_added: 'Thought added successfully',
        thought_revised: 'Thought revised successfully',
        branch_created: 'Branch created successfully',
        session_concluded: 'Thinking session concluded successfully'
      },
      decision: {
        session_started: 'Decision session started successfully',
        criteria_added: 'Criteria added successfully',
        option_added: 'Option added successfully',
        option_evaluated: 'Option evaluated successfully',
        recommendation_generated: 'Recommendation generated successfully'
      },
      external: {
        data_fetched: 'External data fetched successfully',
        data_attached: 'External data attached to session',
        source_not_found: 'External data source not found'
      },
      analysis: {
        bias_detected: 'Bias analysis completed',
        logic_validated: 'Logic validation completed',
        risks_assessed: 'Risk assessment completed',
        alternatives_generated: 'Alternatives generated successfully'
      },
      errors: {
        rate_limit_exceeded: 'Rate limit exceeded. Please try again later.',
        session_expired: 'Session has expired',
        invalid_session_id: 'Invalid session ID format',
        data_source_error: 'Error fetching from external data source'
      },
      messages: {
        welcome: 'Welcome to Decision MCP by BuildWorks.AI',
        session_recovered: 'Session recovered from database',
        cache_hit: 'Data retrieved from cache',
        performance_optimized: 'Operation completed with performance optimization'
      },
      validation: {
        problem: {
          required: 'Problem description is required',
          min_length: 'Problem description must be at least 10 characters',
          max_length: 'Problem description must be less than 5000 characters'
        },
        thought: {
          required: 'Thought content is required',
          max_length: 'Thought must be less than 2000 characters'
        },
        criteria: {
          name_required: 'Criteria name is required',
          name_max_length: 'Criteria name must be less than 100 characters',
          description_required: 'Criteria description is required',
          description_max_length: 'Criteria description must be less than 500 characters'
        }
      },
      tools: {
        start_thinking: {
          description: 'Start a new sequential thinking session to break down complex problems'
        },
        add_thought: {
          description: 'Add a thought to an existing thinking session'
        },
        start_decision: {
          description: 'Start a new decision-making session with criteria and options'
        },
        add_criteria: {
          description: 'Add evaluation criteria to a decision session'
        },
        fetch_external_data: {
          description: 'Fetch data from external sources to inform decisions'
        }
      }
    };

    // Create English file
    writeFileSync(
      join(localesDir, 'en.json'),
      JSON.stringify(enTranslations, null, 2)
    );

    // Create Spanish translations
    const esTranslations = {
      common: {
        success: 'Éxito',
        error: 'Error',
        validation_failed: 'Validación fallida',
        session_not_found: 'Sesión no encontrada',
        invalid_input: 'Entrada inválida proporcionada'
      },
      thinking: {
        session_started: 'Sesión de pensamiento iniciada exitosamente',
        thought_added: 'Pensamiento agregado exitosamente',
        thought_revised: 'Pensamiento revisado exitosamente',
        branch_created: 'Rama creada exitosamente',
        session_concluded: 'Sesión de pensamiento concluida exitosamente'
      },
      decision: {
        session_started: 'Sesión de decisión iniciada exitosamente',
        criteria_added: 'Criterio agregado exitosamente',
        option_added: 'Opción agregada exitosamente',
        option_evaluated: 'Opción evaluada exitosamente',
        recommendation_generated: 'Recomendación generada exitosamente'
      },
      external: {
        data_fetched: 'Datos externos obtenidos exitosamente',
        data_attached: 'Datos externos adjuntos a la sesión',
        source_not_found: 'Fuente de datos externos no encontrada'
      },
      analysis: {
        bias_detected: 'Análisis de sesgo completado',
        logic_validated: 'Validación de lógica completada',
        risks_assessed: 'Evaluación de riesgos completada',
        alternatives_generated: 'Alternativas generadas exitosamente'
      }
    };

    writeFileSync(
      join(localesDir, 'es.json'),
      JSON.stringify(esTranslations, null, 2)
    );

    // Create French translations
    const frTranslations = {
      common: {
        success: 'Succès',
        error: 'Erreur',
        validation_failed: 'Validation échouée',
        session_not_found: 'Session non trouvée',
        invalid_input: 'Entrée invalide fournie'
      },
      thinking: {
        session_started: 'Session de réflexion démarrée avec succès',
        thought_added: 'Pensée ajoutée avec succès',
        thought_revised: 'Pensée révisée avec succès',
        branch_created: 'Branche créée avec succès',
        session_concluded: 'Session de réflexion conclue avec succès'
      },
      decision: {
        session_started: 'Session de décision démarrée avec succès',
        criteria_added: 'Critère ajouté avec succès',
        option_added: 'Option ajoutée avec succès',
        option_evaluated: 'Option évaluée avec succès',
        recommendation_generated: 'Recommandation générée avec succès'
      },
      external: {
        data_fetched: 'Données externes récupérées avec succès',
        data_attached: 'Données externes attachées à la session',
        source_not_found: 'Source de données externes non trouvée'
      },
      analysis: {
        bias_detected: 'Analyse de biais terminée',
        logic_validated: 'Validation de logique terminée',
        risks_assessed: 'Évaluation des risques terminée',
        alternatives_generated: 'Alternatives générées avec succès'
      }
    };

    writeFileSync(
      join(localesDir, 'fr.json'),
      JSON.stringify(frTranslations, null, 2)
    );
  }
}

// Singleton instance
export const i18nService = new I18nService();

// Helper function to get translated response
export function createTranslatedResponse<T>(
  success: boolean,
  data?: T,
  error?: string,
  messageKey?: string,
  options?: Record<string, unknown>
): { success: boolean; data?: T; error?: string; metadata?: { message: string } } {
  const response: { success: boolean; data?: T; error?: string; metadata?: { message: string } } = { success };
  
  if (data) {
    response.data = data;
  }
  
  if (error) {
    response.error = error;
  }
  
  if (messageKey) {
    response.metadata = {
      message: i18nService.translateMessage(messageKey, options)
    };
  }
  
  return response;
}

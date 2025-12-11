import { createClient } from '@supabase/supabase-js';

export interface DatabaseConfig {
  type: 'supabase';
  connection: any;
}

class DatabaseManager {
  private static instance: DatabaseManager;
  private db: any;
  private config: DatabaseConfig;

  private constructor() {
    this.config = {
      type: 'supabase',
      connection: null,
    };
  }

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  private ensureInitialized() {
    if (this.db) return;

    const supabaseUrl = process.env['SUPABASE_URL'];
    const supabaseKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

    if (!supabaseUrl || !supabaseKey) {
      // Em ambiente de teste, podemos não ter as vars num primeiro momento de import,
      // mas elas devem existir quando o banco for usado.
      throw new Error(
        'Supabase URL and Service Role Key must be provided in environment variables.',
      );
    }

    this.config.connection = createClient(supabaseUrl, supabaseKey);
    this.db = this.config.connection;
  }

  getDatabase() {
    this.ensureInitialized();
    return this.db;
  }

  getConfig() {
    // Se precisarmos da config completa, garantimos init
    // Mas para pegar o tipo 'supabase' talvez não precise.
    // Porem o server.ts usa getDatabase() logo em seguida.
    // Vamos garantir init
    try {
      this.ensureInitialized();
    } catch (e) {
      // Se falhar init silenciamos caso seja apenas checagem de tipo?
      // Não, server.ts espera funcionar.
    }
    return this.config;
  }
}

export const databaseManager = DatabaseManager.getInstance();

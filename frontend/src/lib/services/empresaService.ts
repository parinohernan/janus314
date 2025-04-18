import { PUBLIC_API_URL } from '$env/static/public';

export interface EmpresaInfo {
  sucursal: string;
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
}

class EmpresaService {
  private static instance: EmpresaService;
  private empresaInfo: EmpresaInfo | null = null;

  private constructor() {}

  public static getInstance(): EmpresaService {
    if (!EmpresaService.instance) {
      EmpresaService.instance = new EmpresaService();
    }
    return EmpresaService.instance;
  }

  public async getEmpresaInfo(): Promise<EmpresaInfo> {
    if (this.empresaInfo) {
      return this.empresaInfo;
    }

    try {
      const response = await fetch(`${PUBLIC_API_URL}/empresa/info`);
      if (!response.ok) {
        throw new Error('Error al obtener información de la empresa');
      }
      const data = await response.json() as EmpresaInfo;
      this.empresaInfo = data;
      return this.empresaInfo;
    } catch (error) {
      console.error('Error en getEmpresaInfo:', error);
      throw error;
    }
  }

  public async getSucursal(): Promise<string> {
    const info = await this.getEmpresaInfo();
    return info.sucursal;
  }
}

export const empresaService = EmpresaService.getInstance(); 
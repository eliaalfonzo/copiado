import { LocalStorageAdapter } from './persistence/LocalStorageAdapter';
import { LocalStorageClientRepository } from './persistence/LocalStorageClientRepository';
import { LocalStorageProductRepository } from './persistence/LocalStorageProductRepository';
import { LocalStorageSaleRepository } from './persistence/LocalStorageSaleRepository';
import { LocalStorageSettingsRepository } from './persistence/LocalStorageSettingsRepository';
import { seedInitialData } from './persistence/seedData';
import { BcvTodayProvider } from './exchange-rate/BcvTodayProvider';
import { PyDolarVeProvider } from './exchange-rate/PyDolarVeProvider';
import { DolarApiProvider } from './exchange-rate/DolarApiProvider';
import { CompositeExchangeRateProvider } from './exchange-rate/CompositeExchangeRateProvider';
import { JsPdfGeneratorAdapter } from './pdf/JsPdfGeneratorAdapter';
import { XlsxExporterAdapter } from './excel/XlsxExporterAdapter';

import { CreateClient } from '@/application/use-cases/clients/CreateClient';
import { UpdateClient } from '@/application/use-cases/clients/UpdateClient';
import { ListClients } from '@/application/use-cases/clients/ListClients';
import { SearchClients } from '@/application/use-cases/clients/SearchClients';
import { DeleteClient } from '@/application/use-cases/clients/DeleteClient';

import { CreateProduct } from '@/application/use-cases/products/CreateProduct';
import { UpdateProduct } from '@/application/use-cases/products/UpdateProduct';
import { UpdateProductPrice } from '@/application/use-cases/products/UpdateProductPrice';
import { ToggleProductActive } from '@/application/use-cases/products/ToggleProductActive';
import { ListProducts } from '@/application/use-cases/products/ListProducts';
import { ResetProductsToDefaults } from '@/application/use-cases/products/ResetProductsToDefaults';

import { CalculateSale } from '@/application/use-cases/sales/CalculateSale';
import { CreateSale } from '@/application/use-cases/sales/CreateSale';
import { ListSales } from '@/application/use-cases/sales/ListSales';
import { GetMonthlySummary } from '@/application/use-cases/sales/GetMonthlySummary';
import { CancelSale } from '@/application/use-cases/sales/CancelSale';
import { DeleteSale } from '@/application/use-cases/sales/DeleteSale';

import { GetCurrentExchangeRate } from '@/application/use-cases/exchange-rate/GetCurrentExchangeRate';
import { RefreshExchangeRate } from '@/application/use-cases/exchange-rate/RefreshExchangeRate';
import { SetManualExchangeRate } from '@/application/use-cases/exchange-rate/SetManualExchangeRate';

import { GenerateInvoicePdf } from '@/application/use-cases/reports/GenerateInvoicePdf';
import { GenerateMonthlyReportPdf } from '@/application/use-cases/reports/GenerateMonthlyReportPdf';
import { ExportSalesToExcel } from '@/application/use-cases/reports/ExportSalesToExcel';

import { CloseMonthlyPeriod } from '@/application/use-cases/period/CloseMonthlyPeriod';
import { UpdateBusinessSettings } from '@/application/use-cases/settings/UpdateBusinessSettings';
import { GetBusinessSettings } from '@/application/use-cases/settings/GetBusinessSettings';

/**
 * Contenedor de composicion (composition root) de la aplicacion.
 *
 * Aqui, y SOLO aqui, se decide que implementacion concreta de cada
 * puerto se utiliza. Toda la aplicacion (React) consume estas
 * instancias ya construidas a traves de hooks, nunca instancia
 * adaptadores directamente. Esto es lo que hace posible cumplir DIP:
 * los casos de uso dependen de interfaces, y este archivo es el unico
 * lugar que conoce las clases concretas.
 */
class Container {
  readonly storage = new LocalStorageAdapter();

  readonly clientRepository = new LocalStorageClientRepository(this.storage);
  readonly productRepository = new LocalStorageProductRepository(this.storage);
  readonly saleRepository = new LocalStorageSaleRepository(this.storage);
  readonly settingsRepository = new LocalStorageSettingsRepository(this.storage);

  readonly exchangeRateProvider = new CompositeExchangeRateProvider([
    new BcvTodayProvider(),
    new PyDolarVeProvider(),
    new DolarApiProvider(),
  ]);
  readonly pdfGenerator = new JsPdfGeneratorAdapter();
  readonly excelExporter = new XlsxExporterAdapter();

  readonly createClient = new CreateClient(this.clientRepository);
  readonly updateClient = new UpdateClient(this.clientRepository);
  readonly listClients = new ListClients(this.clientRepository);
  readonly searchClients = new SearchClients(this.clientRepository);
  readonly deleteClient = new DeleteClient(this.clientRepository, this.saleRepository);

  readonly createProduct = new CreateProduct(this.productRepository);
  readonly updateProduct = new UpdateProduct(this.productRepository);
  readonly updateProductPrice = new UpdateProductPrice(this.productRepository);
  readonly toggleProductActive = new ToggleProductActive(this.productRepository);
  readonly listProducts = new ListProducts(this.productRepository);
  readonly resetProductsToDefaults = new ResetProductsToDefaults(this.productRepository);

  readonly calculateSale = new CalculateSale();
  readonly createSale = new CreateSale(this.saleRepository, this.clientRepository);
  readonly listSales = new ListSales(this.saleRepository);
  readonly getMonthlySummary = new GetMonthlySummary();
  readonly cancelSale = new CancelSale(this.saleRepository);
  readonly deleteSale = new DeleteSale(this.saleRepository);

  readonly getCurrentExchangeRate = new GetCurrentExchangeRate(
    this.exchangeRateProvider,
    this.settingsRepository,
    this.settingsRepository
  );
  readonly refreshExchangeRate = new RefreshExchangeRate(this.getCurrentExchangeRate);
  readonly setManualExchangeRate = new SetManualExchangeRate(this.settingsRepository);

  readonly generateInvoicePdf = new GenerateInvoicePdf(this.pdfGenerator, this.settingsRepository);
  readonly generateMonthlyReportPdf = new GenerateMonthlyReportPdf(
    this.pdfGenerator,
    this.settingsRepository,
    this.getMonthlySummary
  );
  readonly exportSalesToExcel = new ExportSalesToExcel(this.excelExporter, this.getMonthlySummary);

  readonly closeMonthlyPeriod = new CloseMonthlyPeriod(this.saleRepository, this.settingsRepository);
  readonly updateBusinessSettings = new UpdateBusinessSettings(this.settingsRepository);
  readonly getBusinessSettings = new GetBusinessSettings(this.settingsRepository);

  async initialize(): Promise<void> {
    await seedInitialData(this.storage);
  }
}

export const container = new Container();
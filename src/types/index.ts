export type OrderStatus =
  | "ABERTA"
  | "EM_ANDAMENTO"
  | "AGUARDANDO_PAGAMENTO"
  | "CONCLUIDA";

export type BudgetStatus = "PENDENTE" | "APROVADO" | "RECUSADO";

export interface Client {
  id: number;
  name: string;
  telephone: string;
  cpfCnpj: string;
  address: string;
}

export interface CreateClientDTO {
  name: string;
  telephone: string;
  cpfCnpj?: string;
  address?: string;
}

export type UpdateClientDTO = CreateClientDTO;

export interface Vehicle {
  id: number;
  plate: string;
  brand: string;
  model: string;
  fabricationAndModel: string;
  color: string;
  renavam: string;
  chassis: string;
  clientId: number | null;
}

export interface CreateVehicleDTO {
  plate?: string;
  brand: string;
  model: string;
  fabricationAndModel: string;
  color: string;
  renavam?: string;
  chassis: string;
  clientId?: number | null;
}

export type UpdateVehicleDTO = CreateVehicleDTO;

export interface Service {
  id: number;
  serviceName: string;
  price: number;
}

export interface CreateServiceDTO {
  serviceName: string;
  price: number;
}

export type UpdateServiceDTO = CreateServiceDTO;

export interface ServiceOrderItem {
  id: number;
  serviceId: number;
  quantity: number;
  unitPrice: number;
}

export interface CreateServiceOrderItemDTO {
  serviceId: number;
  quantity?: number;
  unitPrice: number;
}

export interface ServiceOrder {
  id: number;
  code: string;
  orderStatus: OrderStatus;
  clientId: number;
  vehicleId: number;
  originBudgetId: number | null;
  servicesTotal: number;
  feesTotal: number;
  total: number;
  items: ServiceOrderItem[];
}

export interface CreateServiceOrderDTO {
  code: string;
  orderStatus: OrderStatus;
  clientId: number;
  vehicleId: number;
  originBudgetId?: number | null;
  servicesTotal?: number;
  feesTotal?: number;
  total?: number;
  items?: CreateServiceOrderItemDTO[];
}

export type UpdateServiceOrderDTO = CreateServiceOrderDTO;

export interface BudgetItem {
  id: number;
  serviceId: number;
  quantity: number;
  unitPrice: number;
}

export interface CreateBudgetItemDTO {
  serviceId: number;
  quantity?: number;
  unitPrice: number;
}

export interface Budget {
  id: number;
  code: string;
  status: BudgetStatus;
  clientId: number;
  totalPrice: number;
  items: BudgetItem[];
}

export interface CreateBudgetDTO {
  code: string;
  status: BudgetStatus;
  clientId?: number;
  totalPrice?: number;
  items?: CreateBudgetItemDTO[];
}

export type UpdateBudgetDTO = CreateBudgetDTO;

export interface VehicleData {
  plate: string;
  renavam: string;
  chassis: string;
  makeModel: string;
  manufactureYear: number;
  modelYear: number;
  color: string;
  type: string;
  species: string;
  category: string;
  city: string;
  plateState: string;
  fuel: string;
  renavamStatus: string;
  ownerCpf: string;
}

export interface Licensing {
  year: string;
  documentStatus: string;
  document: string;
  dueDate: string;
}

export interface ViolationSummary {
  count: number;
  amount: number;
}

export interface Violations {
  upcoming: ViolationSummary;
  overdue: ViolationSummary;
  suspended: ViolationSummary;
  awaitingDefense: ViolationSummary;
  awaitingJudgment: ViolationSummary;
}

export interface Restriction {
  type: string;
  description: string;
}

export interface Debt {
  type: string;
  year: number;
  amount: number;
  dueDate: string;
}

export interface StepError {
  step: string;
  message: string;
}

export interface VehicleQueryResponse {
  jobId: string;
  plate: string;
  source: string;
  collectedAt: string;
  vehicle: VehicleData;
  licensing: Licensing;
  violations: Violations;
  restrictions: Restriction[];
  debts: Debt[];
  status: string;
  errors: StepError[];
}

export interface NfeAccessKeyInfo {
  accessKey: string;
  valid: boolean;
  state: string;
  stateCode: number;
  issueYear: number;
  issueMonth: number;
  issuerCnpj: string;
  model: string;
  series: string;
  invoiceNumber: string;
  checkDigit: string;
}

export interface NfeImportResponse {
  accessKey: NfeAccessKeyInfo;
  vehicle: CreateVehicleDTO;
  warnings: string[];
}

export interface SeriesPoint {
  label: string;
  value: number;
}

export interface OrderStatusCount {
  status: OrderStatus;
  label: string;
  value: number;
}

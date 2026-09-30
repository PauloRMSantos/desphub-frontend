export {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
} from "./clients";
export {
  getVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  queryVehicle,
  queryVehicleSc,
  importNfeByPdf,
  parseVehicleDocument,
} from "./vehicles";
export {
  getServices,
  getService,
  createService,
  updateService,
  deleteService,
} from "./services";
export {
  getServiceOrders,
  getServiceOrder,
  createServiceOrder,
  updateServiceOrder,
  deleteServiceOrder,
} from "./service-orders";
export {
  getBudgets,
  getBudget,
  createBudget,
  updateBudget,
  deleteBudget,
} from "./budgets";
export {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from "./expenses";
export {
  login,
  getMe,
  logout,
  resetPassword,
  changeOwnPassword,
} from "./auth";
export { getGovbrSession, issuePairingToken } from "./rpa";
export {
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getVariableCatalog,
  aiTemplateFromText,
  aiTemplateFromDescription,
} from "./templates";
export {
  generateDocument,
  getDocuments,
  getDocument,
  downloadDocumentPdf,
} from "./documents";
export {
  getOffices,
  getOffice,
  createOffice,
  deleteOffice,
  getOfficeUsers,
  createOfficeUser,
  updateOfficeUserPermissions,
  setOfficeUserActive,
  deleteOfficeUser,
  resetOfficeUserPassword,
} from "./offices";

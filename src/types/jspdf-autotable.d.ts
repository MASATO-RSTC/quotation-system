declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: object) => jsPDF;
  }
}

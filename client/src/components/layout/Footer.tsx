import ReportForm from '../reports/ReportForm';

const Footer = () => {
  return (
    <footer className="bg-neutral-100 border-t border-neutral-200">
      <div className="container mx-auto px-4 py-5">
        <div className="flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-neutral-500 text-sm">
            &copy; 2025 DesignAuto App. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-4">
            <ReportForm />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
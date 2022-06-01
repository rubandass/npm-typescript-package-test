/// <reference types="react" />
interface AlertDialogProps {
    title: string;
    message: string;
    details?: string;
    onClose: () => void;
}
declare const AlertDialog: (props: AlertDialogProps) => JSX.Element;
export default AlertDialog;

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Mail, DollarSign } from 'lucide-react';
import { EmailTemplateDialog } from '@/components/service/EmailTemplateDialog';

export function TicketActions({ ticket, onUpdate, disabled = false }) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTemplateType, setSelectedTemplateType] = useState(null);

  const handleNotify = (templateType) => {
    if (disabled) {
      toast({
        title: "Behörighet saknas",
        description: "Du har inte behörighet att uppdatera ärenden.",
        variant: "destructive",
      });
      return;
    }

    if (!ticket.customer_email) {
      toast({
        title: "E-postadress saknas",
        description: "Kan inte meddela kund eftersom ingen e-postadress är registrerad.",
        variant: "destructive",
      });
      return;
    }

    const newStatus = templateType === 'reparationFardig' ? 'Färdig' : 'Väntar på kund';
    if (ticket.status !== newStatus) {
      onUpdate(ticket.id, { status: newStatus });
    }

    setSelectedTemplateType(templateType);
    setIsDialogOpen(true);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
         <h4 className="font-semibold text-gray-600 text-sm flex-shrink-0">Åtgärder:</h4>
          <div className="flex flex-wrap gap-3">
              <Button
                size="sm"
                variant="outline"
                className="border-blue-500/50 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 gap-2"
                onClick={() => handleNotify('reparationFardig')}
                disabled={!ticket.customer_email || disabled}
              >
                <Mail size={16} /> Meddela att reparation är klar
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-purple-500/50 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:text-purple-800 gap-2"
                onClick={() => handleNotify('kostnadsforslag')}
                disabled={!ticket.customer_email || disabled}
              >
                <DollarSign size={16} /> Skicka kostnadsförslag
              </Button>
          </div>
      </div>
      <EmailTemplateDialog 
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        ticket={ticket}
        templateType={selectedTemplateType}
        onUpdate={onUpdate}
      />
    </>
  );
}

import { useState } from 'react';
import { Drawer, Grid } from 'antd';
import { CustomerPickerStep } from './CustomerPickerStep';
import { CreateCreditPaymentDrawer } from './CreateCreditPaymentDrawer';

const { useBreakpoint } = Grid;

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CustomerPaymentPickerDrawer({ open, onClose }: Props) {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [pickedCustomerId, setPickedCustomerId] = useState<string | null>(null);

  const handleClose = () => {
    setPickedCustomerId(null);
    onClose();
  };

  // When we have a customer selected, swap to the payment form.
  if (pickedCustomerId) {
    return (
      <CreateCreditPaymentDrawer
        open={open}
        customerId={pickedCustomerId}
        onClose={handleClose}
        onSuccess={handleClose}
      />
    );
  }

  return (
    <Drawer
      title="Pick a customer"
      open={open}
      onClose={handleClose}
      width={isMobile ? '100%' : 460}
      destroyOnClose
    >
      <CustomerPickerStep
        onPick={(id) => setPickedCustomerId(id)}
        onCancel={handleClose}
      />
    </Drawer>
  );
}
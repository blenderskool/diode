import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  ChakraProvider,
} from '@chakra-ui/react';
import { useRef } from 'react';
import { render, unmountComponentAtNode } from 'react-dom';

import theme from '@/lib/chakra-theme';

type ConfirmDialogOptions = {
  title: string;
  description: string;
  btnConfirmTxt: string;
};

type AlertComponentProps = ConfirmDialogOptions & {
  onCancel: () => any;
  onConfirm: () => any;
};

function AlertComponent({
  title,
  description,
  btnConfirmTxt,
  onCancel,
  onConfirm,
}: AlertComponentProps) {
  const cancelRef = useRef();

  return (
    <ChakraProvider theme={theme}>
      <AlertDialog isOpen leastDestructiveRef={cancelRef} onClose={onCancel}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader
              fontFamily="heading"
              fontWeight="700"
              fontSize="2xl"
            >
              {title}
            </AlertDialogHeader>

            <AlertDialogBody color="gray.500" fontSize="sm">
              {description}
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onCancel}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={onConfirm} ml="4">
                {btnConfirmTxt}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </ChakraProvider>
  );
}

/**
 * Helper function to show confirm dialog
 * @param param0 Options for confirm dialog shown
 * @returns Promise which resolves to a boolean indicating whether user confirmed the action
 */
function confirmDialog({
  title = 'Are you sure?',
  description = 'This action is irreversible.',
  btnConfirmTxt = 'Confirm',
}: Partial<ConfirmDialogOptions>) {
  let container = document.getElementById('alert-dialog');
  if (!container) {
    container = document.createElement('div');
    container.id = 'alert-dialog';
    document.body.appendChild(container);
  }

  return new Promise<boolean>((resolve) => {
    const close = () => {
      unmountComponentAtNode(container);
      container.remove();
    };

    const handleCancel = () => {
      close();
      resolve(false);
    };
    const handleConfirm = () => {
      close();
      resolve(true);
    };

    render(
      <AlertComponent
        title={title}
        description={description}
        btnConfirmTxt={btnConfirmTxt}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
      />,
      container
    );
  });
}

export default confirmDialog;

import { Button } from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { useRouter } from 'next/router';

export default function BackLink(props) {
  const router = useRouter();

  return (
    <div>
      <Button variant="link" leftIcon={<ArrowBackIcon />} onClick={router.back} {...props} />
    </div>
  )
}

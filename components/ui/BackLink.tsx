import { Button } from '@chakra-ui/react';
import { ChevronLeftIcon } from '@heroicons/react/outline';
import { useRouter } from 'next/router';

export default function BackLink(props) {
  const router = useRouter();

  return (
    <div>
      <Button variant="link" leftIcon={<ChevronLeftIcon width="16" />} onClick={router.back} {...props} />
    </div>
  )
}

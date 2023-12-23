import {
  StatGroup,
  Stat,
  StatLabel,
  StatNumber,
  Divider,
} from '@chakra-ui/react';

type Props = {
  successes: number;
  fails: number;
  avgResponseTime?: number;
};

export default function ApiStats({ successes, fails, avgResponseTime }: Props) {
  return (
    <StatGroup gridGap="8">
      <Stat>
        <StatLabel whiteSpace="nowrap" textColor="green.500" fontWeight="600">
          Successful calls
        </StatLabel>
        <StatNumber>{successes}</StatNumber>
      </Stat>
      <Divider orientation="vertical" />
      <Stat>
        <StatLabel whiteSpace="nowrap" textColor="red.500" fontWeight="600">
          Failed calls
        </StatLabel>
        <StatNumber>{fails}</StatNumber>
      </Stat>
      {avgResponseTime !== undefined && (
        <>
          <Divider orientation="vertical" />
          <Stat>
            <StatLabel
              whiteSpace="nowrap"
              textColor="blue.500"
              fontWeight="600"
            >
              Average time(ms)
            </StatLabel>
            <StatNumber>{avgResponseTime}</StatNumber>
          </Stat>
        </>
      )}
    </StatGroup>
  );
}

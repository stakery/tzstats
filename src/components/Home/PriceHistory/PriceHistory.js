import React from 'react';
import PriceChart from './PriceChart';
import { Card, FlexRow } from '../../Common';
import styled from 'styled-components';

const PriceHistory = ({ priceHistory }) => {
  return (
    <Wrapper>
      <Card title={'Tezos Price Last 30d'}>
        <FlexRow>
          <PriceChart type={'svg'} data={priceHistory} />
        </FlexRow>
      </Card>
    </Wrapper>
  );
};
const Wrapper = styled.div`
  min-width: 340px;
  flex: 2;
  margin: 0 5px;
`;
export default PriceHistory;

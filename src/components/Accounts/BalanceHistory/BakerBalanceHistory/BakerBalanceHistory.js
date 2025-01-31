import React from 'react';
import BalanceChart from './BalanceChart';
import { DataBox, FlexRow, FlexColumn, Card } from '../../../Common';
import styled from 'styled-components';

const BakerBalanceHistory = ({ account, balanceHistory, stakingData }) => {
  return (
    <Wrapper>
      <Card title={'Balances Last 30d'}>
        <FlexColumn>
          <FlexRow flex={1} mb={20}>
            <BalanceChart type={'svg'} data={stakingData} />
          </FlexRow>
          <FlexRow>
            <LegendItem color={'#858999'}>
              <DataBox title="Total" />
            </LegendItem>
            <LegendItem color={'#17eef4'}>
              <DataBox title="Spendable" />
            </LegendItem>
            <LegendItem color={'#22BAF8'}>
              <DataBox title="Deposits" />
            </LegendItem>
            <LegendItem color={'#626977'}>
              <DataBox title="Pending Rewards" />
            </LegendItem>
          </FlexRow>
        </FlexColumn>
      </Card>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  flex: 1;
  min-width: 340px;
  margin: 0 5px;
`;

const LegendItem = styled.div`
  margin-left: 20px;
  margin-right: 10px;
  position: relative;
  white-space: nowrap;
  &:after {
    content: '-';
    position: absolute;
    line-height: 0;
    left: -20px;
    top: 5px;
    font-size: 30px;
    color: ${prop => prop.color};
  }
`;

export default BakerBalanceHistory;

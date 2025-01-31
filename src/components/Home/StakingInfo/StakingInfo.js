import React from 'react';
import styled from 'styled-components';
import { Card, DataBox, FlexRowSpaceBetween, FlexColumnSpaceAround } from '../../Common';
import { useGlobal } from 'reactn';

const StakingInfo = () => {
  const [chain] = useGlobal('chain');

  return (
    <Wrapper>
      <Card title={`Staking Activity`} mh={115}>
        <FlexColumnSpaceAround flex={1}>
        <FlexRowSpaceBetween mb={'5px'}>
          <DataBox
            title="Staking Ratio"
            valueSize="14px"
            valueType="text"
            value={`${((100 * chain.supply.staking) / chain.supply.total).toFixed(2)}%`}
          />
          <DataBox
            title="Rewards"
            valueType="text"
            valueSize="14px"
            value={`${(chain.inflation_rate_1y / (chain.supply.staking / chain.supply.total)).toFixed(2)}%`}
          />
          <DataBox
            title="Inflation"
            valueType="text"
            valueSize="14px"
            value={`${chain.inflation_rate_1y.toFixed(2)}%`}
          />
          <DataBox
            title="Active Bakers"
            valueSize="14px"
            value={chain.roll_owners}
          />
        </FlexRowSpaceBetween>
        </FlexColumnSpaceAround>
      </Card>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  flex: 1;
  min-width: 340px;
  margin: 0 5px;
`;
export default StakingInfo;

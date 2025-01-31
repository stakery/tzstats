import React from 'react';
import { useGlobal } from 'reactn';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import BlockOperations from '../components/Blocks/BlockOperations';
import BlockInfo from '../components/Blocks/BlockInfo';
import { getBlock } from '../services/api/tz-stats';
import { formatValue, buildTitle } from '../utils';
import { Spinner, NotFound, Error, FlexRow } from '../components/Common';
import { withRouter } from 'react-router-dom';
import { BackIcon, FwdIcon } from '../components/Common/SvgIcons';

const BlockPage = ({ match, history }) => {
  const [data, setData] = React.useState({ isLoaded: false, wait: false });
  const [txType, setTxType] = React.useState(null);
  const blk = React.useRef(0);
  const [config] = useGlobal('config');
  const [chain] = useGlobal('chain');
  const hash = match.params.hash;

  React.useEffect(() => {
    document.title = buildTitle(config, 'Block', hash);
  }, [config, hash]);

  const load = React.useCallback(async () => {
    try {
      let block = await getBlock(hash);
      document.title = buildTitle(config, 'Block', formatValue(block.height));
      blk.current = block;
      setData({
        isLoaded: true,
        block: block,
      });
    } catch (e) {
      switch (e.status) {
        case 502:
        case 504:
          return;
        case 404:
          setData({
            isLoaded: true,
            wait: true,
          });
          break;
        default:
          setData({
            isLoaded: true,
            error: e,
          });
      }
    }
  }, [hash, config]);

  React.useEffect(() => {
    load();
  }, [hash, load]);

  React.useEffect(() => {
    if (!!blk.current && !blk.current.successor) {
      load();
    }
  }, [chain.height, load]);

  switch (true) {
    case !data.isLoaded:
      return <Spinner />;
    case !!data.error:
      return <Error err={data.error} />;
    case data.wait:
      return <NotFound reloadFunc={load} type="block" hash={hash} />;
    default:
      return (
        <Wrapper>
          <FlexRow>
            <NavLeft>{data.block.predecessor&&<Link to={`/${data.block.predecessor}`}><BackIcon fontSize={35} /></Link>}</NavLeft>
            <NavHeadline><h1>{`Block ${formatValue(data.block.height)}`}</h1></NavHeadline>
            <NavRight>{data.block.successor&&<Link to={`/${data.block.successor}`}><FwdIcon fontSize={35}/></Link>}</NavRight>
          </FlexRow>
          <BlockInfo block={data.block} setTxType={setTxType} />
          {!data.block.is_orphan ? <BlockOperations block={data.block} txType={txType} /> : ''}
        </Wrapper>
      );
  }
};

const Wrapper = styled.div``;

const NavRight = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  cursor: pointer;
  color: rgba(255,255,255,0.82);
  &:hover {
    color: #fff;
  }
`;

const NavLeft = styled(NavRight)`
  justify-content: flex-end;
`;

const NavHeadline = styled(NavRight)`
  text-align: center;
  color: #fff;
  cursor: default;
  &>h1{
    margin: 10px auto;
  }
`;


export default withRouter(BlockPage);

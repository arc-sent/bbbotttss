import { LoadingOutlined } from '@ant-design/icons';
import { Flex, Spin } from 'antd';

export const SpinLoading = () => {
    return (
        <Flex justify="center" align="center" style={{ height: "100vh" }} >
            <Spin indicator={<LoadingOutlined style={{ fontSize: 48, color: '#9D7CB2' }} spin />} />
        </Flex >
    )
}
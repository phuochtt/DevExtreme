/* eslint-disable jest/expect-expect */
import { h } from 'preact';
import { shallow } from 'enzyme';
import { GridPager, viewFunction as GridPagerComponent } from '../../../js/renovation/pager/grid_pager';

describe('GridPager', () => {
  describe('View', () => {
    it('render props', () => {
      const props = {
        pageIndex: 3,
        pageIndexChange: jest.fn(),
        props: {},
        restAttributes: { restAttribute: {} },
      } as Partial<GridPager>;
      const tree = shallow(<GridPagerComponent {...props as any} /> as any);
      expect(tree.at(0).props()).toMatchObject({
        pageIndex: 3,
        pageIndexChange: props.pageIndexChange,
        restAttribute: props.restAttributes?.restAttribute,
      });
    });
  });
  describe('Behaviuor', () => {
    it('pageIndex', () => {
      const component = new GridPager({ pageIndex: 4 });
      expect(component.pageIndex).toBe(3);
    });
    it('pageIndexChange', () => {
      const pageIndexChange = jest.fn();
      const component = new GridPager({ pageIndexChange });
      component.pageIndexChange(4);
      expect(pageIndexChange).toBeCalledWith(5);
    });
  });
});

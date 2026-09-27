const { createHarness, React } = require('./harness.cjs');
function screenHarness() {
  const h = createHarness();
  Object.assign(h.mocks['react-native'], { View:'View', Text:'Text', Pressable:'Pressable', Image:'Image',
    ActivityIndicator:'Spinner', SafeAreaView:'SafeArea', ScrollView:'ScrollView', Modal:'Modal', RefreshControl:'Refresh',
    StyleSheet:{ create:x=>x, absoluteFillObject:{} }, Dimensions:{get:()=>({width:400,height:800})},
    useWindowDimensions:()=>({width:400,height:800}), Platform:{OS:'android'},
    FlatList:props=>React.createElement('List',null,props.data.map((item,index)=>React.createElement(React.Fragment,{key:props.keyExtractor?.(item)||item.id},props.renderItem({item,index})))) });
  h.mocks['@expo/vector-icons']={Ionicons:'Icon'};
  h.mocks['expo-linear-gradient']={LinearGradient:'Gradient'};
  h.mocks['react-native-safe-area-context']={useSafeAreaInsets:()=>({top:20,bottom:20})};
  h.mocks['@/src/performance/diagnostics/media']={diagnosticImage:()=> 'Image',diagnosticVideo:()=> 'Video'};
  h.mocks['@/src/performance/diagnostics/screens']={withPerfScreen:x=>x,usePerfContent(){}};
  const colors = new Proxy({}, {get:()=> '#123456'});
  h.mocks['@/src/design/RomBuzzThemeProvider']={useRomBuzzTheme:()=>({colors})};
  h.mocks['@/src/design/rombuzzTypography']={RBZFont:{},useRomBuzzTypography(){}};
  return h;
}
module.exports={screenHarness};

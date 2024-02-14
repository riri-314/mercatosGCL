import {styled} from "@mui/system";
import {
    BlockTypeSelect,
    BoldItalicUnderlineToggles,
    CreateLink,
    headingsPlugin,
    InsertTable,
    InsertThematicBreak,
    linkDialogPlugin,
    listsPlugin,
    ListsToggle,
    MDXEditor,
    tablePlugin,
    thematicBreakPlugin,
    toolbarPlugin,
    UndoRedo
} from "@mdxeditor/editor";
import '@mdxeditor/editor/style.css';

const StyledMDXEditor = styled(MDXEditor)(({theme}) => ({
    /*borderRadius: theme.shape.borderRadius,
    border: `1px solid ${theme.palette.divider}`,
    "&:hover": {
        borderColor: theme.palette.action.hoverBorder,
    },

    "&:focus-within": {
        border: `2px solid ${theme.palette.primary.main}`,
        borderRadius: theme.shape.borderRadius + "px",
    },*/

    "& [role=textbox]": {
        fontFamily: "Public Sans, sans-serif",
        // that would be great if theme.typography was typed
    },

    "& [role=toolbar]": {
        backgroundColor: theme.palette.background.neutral,
        borderRadius: theme.shape.borderRadius + "px",

        "& [type=button]": {
            color: theme.palette.text.secondary,
            fontFamily: "Public Sans, sans-serif",
            '&:hover': {
                backgroundColor: theme.palette.action.hover,
            },
        }
    }

}));

const StyledMDXEditorWrapper = styled('div')(({theme}) => ({
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${theme.palette.divider}`,
    "&:hover": {
        borderColor: theme.palette.action.hoverBorder,
    },

    "&:focus-within": {
        border: `2px solid ${theme.palette.primary.main}`,
        borderRadius: theme.shape.borderRadius + "px",
    },
}));


const EditorWithTheme = ({setRules, markdown}: {
    setRules: (value: string) => void,
    markdown: string,
}) => (
    <StyledMDXEditorWrapper>
        <StyledMDXEditor
            onChange={(e) => setRules(e)}
            plugins={[
                tablePlugin(),
                listsPlugin(),
                headingsPlugin(),
                linkDialogPlugin(),
                thematicBreakPlugin(),
                toolbarPlugin({
                    toolbarContents: () => (
                        <>
                            {' '}
                            <UndoRedo/>
                            <BlockTypeSelect/>
                            <BoldItalicUnderlineToggles/>
                            <ListsToggle/>
                            <InsertTable/>
                            <CreateLink/>
                            <InsertThematicBreak/>
                        </>
                    )
                })
            ]}
            markdown={markdown}
        />
    </StyledMDXEditorWrapper>
);

export default EditorWithTheme;

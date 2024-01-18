import {
    BlockTypeSelect, BoldItalicUnderlineToggles, CreateLink,
    headingsPlugin, InsertTable, InsertThematicBreak,
    linkDialogPlugin,
    listsPlugin, ListsToggle, MDXEditor,
    tablePlugin,
    thematicBreakPlugin,
    toolbarPlugin, UndoRedo
} from "@mdxeditor/editor";
import { styled } from "@mui/system";
import { withTheme } from "@mui/material";

const StyledMDXEditor = styled('div')(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.palette.background.boxShadow,
}));

const EditorWithTheme = withTheme(({ setRules}: { setRules: (value: string) => void}) => (
    <StyledMDXEditor>
        <MDXEditor
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
                            <UndoRedo />
                            <BlockTypeSelect />
                            <BoldItalicUnderlineToggles />
                            <ListsToggle />
                            <InsertTable />
                            <CreateLink />
                            <InsertThematicBreak />
                        </>
                    )
                })
            ]}
            markdown={""}
        />
    </StyledMDXEditor>
));

export default EditorWithTheme;

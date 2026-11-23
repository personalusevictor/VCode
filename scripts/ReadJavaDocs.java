import com.sun.source.tree.ClassTree;
import com.sun.source.tree.MethodTree;
import com.sun.source.tree.VariableTree;
import com.sun.source.util.DocTrees;
import com.sun.source.util.JavacTask;
import com.sun.source.util.TreePathScanner;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;
import java.util.List;
import java.util.stream.Collectors;
import javax.tools.DiagnosticCollector;
import javax.tools.ToolProvider;

class ReadJavaDocs {
    public static void main(String[] args) throws Exception {
        Path root = Path.of(args[0]);
        var compiler = ToolProvider.getSystemJavaCompiler();
        try (var files = Files.walk(root);
             var manager = compiler.getStandardFileManager(null, null, StandardCharsets.UTF_8)) {
            var sources = files.filter(path -> path.toString().endsWith(".java")).sorted().toList();
            var task = (JavacTask) compiler.getTask(null, manager, new DiagnosticCollector<>(),
                    List.of("-proc:none", "--release", "21"), null,
                    manager.getJavaFileObjectsFromPaths(sources));
            var docs = DocTrees.instance(task);
            var encoder = Base64.getEncoder();
            for (var unit : task.parse()) {
                if (unit.getPackageName() == null) continue;
                String file = root.relativize(Path.of(unit.getSourceFile().toUri())).toString();
                new TreePathScanner<Void, String>() {
                    private void emit(String owner, String kind, String name, String parameters) {
                        String doc = docs.getDocComment(getCurrentPath());
                        if (doc == null || doc.isBlank()) return;
                        String encoded = encoder.encodeToString(doc.getBytes(StandardCharsets.UTF_8));
                        System.out.println(String.join("\t", owner, kind, name, parameters, file, encoded));
                    }

                    @Override
                    public Void visitClass(ClassTree tree, String scope) {
                        if (tree.getSimpleName().length() == 0) return null;
                        String owner = scope + "." + tree.getSimpleName();
                        emit(owner, "type", "", "");
                        scan(tree.getMembers(), owner);
                        return null;
                    }

                    @Override
                    public Void visitMethod(MethodTree tree, String owner) {
                        String parameters = tree.getParameters().stream()
                                .map(parameter -> parameter.getType().toString())
                                .collect(Collectors.joining(","));
                        emit(owner, "call", tree.getName().toString(), parameters);
                        return null;
                    }

                    @Override
                    public Void visitVariable(VariableTree tree, String owner) {
                        emit(owner, "field", tree.getName().toString(), "");
                        return null;
                    }
                }.scan(unit, unit.getPackageName().toString());
            }
        }
    }
}

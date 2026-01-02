import { NextResponse } from "next/server";
import { db } from "@/lib/prismadb";
import { getCurrentUser } from "@/lib/auth";


export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "SUPER_ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }


    const { name, description } = await req.json();

    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }

    const slug = name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");

    const app = await db.app.create({
      data: {
        name,
        slug,
        description,
        pages: {
          create: {
            title: "Splash Screen",
            slug: "splash",
            isPublished: true,
            content: `
const { View, Text, StyleSheet, ActivityIndicator } = React;

function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>${name}</Text>
      <ActivityIndicator size="large" color="#0000ff" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

return <App />;
            `,
            transpiled_code: `
// Transpiled code will be generated upon save or first load if we implemented auto-transpile
// For now, this is a placeholder. The preview uses 'content' directly.
            `
          }
        }
      },
    });

    return NextResponse.json(app);
  } catch (error) {
    console.log("[APPS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "SUPER_ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const apps = await db.app.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: { pages: true }
        }
      }
    });

    return NextResponse.json(apps);
  } catch (error) {
    console.log("[APPS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

CREATE TABLE "credit_roles" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"level" text NOT NULL,
	"name" text NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "credit_roles_key_unique" UNIQUE("key"),
	CONSTRAINT "credit_roles_level_check" CHECK ("credit_roles"."level" in ('work', 'edition'))
);
--> statement-breakpoint
CREATE TABLE "edition_credits" (
	"edition_id" text NOT NULL,
	"person_id" text NOT NULL,
	"role_id" text NOT NULL,
	CONSTRAINT "edition_credits_edition_id_person_id_role_id_pk" PRIMARY KEY("edition_id","person_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "edition_works" (
	"edition_id" text NOT NULL,
	"work_id" text NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "edition_works_edition_id_work_id_pk" PRIMARY KEY("edition_id","work_id")
);
--> statement-breakpoint
CREATE TABLE "editions" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"publisher" text,
	"year" integer NOT NULL,
	"language" text NOT NULL,
	"isbn" text,
	CONSTRAINT "editions_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "genres" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "genres_key_unique" UNIQUE("key"),
	CONSTRAINT "genres_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "people" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"born" integer,
	"died" integer,
	"bio" text,
	"photo_url" text,
	CONSTRAINT "people_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	CONSTRAINT "user_roles_user_id_role_pk" PRIMARY KEY("user_id","role")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "work_credits" (
	"work_id" text NOT NULL,
	"person_id" text NOT NULL,
	"role_id" text NOT NULL,
	CONSTRAINT "work_credits_work_id_person_id_role_id_pk" PRIMARY KEY("work_id","person_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "work_genres" (
	"work_id" text NOT NULL,
	"genre_id" text NOT NULL,
	CONSTRAINT "work_genres_work_id_genre_id_pk" PRIMARY KEY("work_id","genre_id")
);
--> statement-breakpoint
CREATE TABLE "works" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"original_title" text,
	"year" integer NOT NULL,
	"original_language" text NOT NULL,
	"synopsis" text,
	CONSTRAINT "works_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "edition_credits" ADD CONSTRAINT "edition_credits_edition_id_editions_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."editions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edition_credits" ADD CONSTRAINT "edition_credits_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edition_credits" ADD CONSTRAINT "edition_credits_role_id_credit_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."credit_roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edition_works" ADD CONSTRAINT "edition_works_edition_id_editions_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."editions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edition_works" ADD CONSTRAINT "edition_works_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_credits" ADD CONSTRAINT "work_credits_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_credits" ADD CONSTRAINT "work_credits_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_credits" ADD CONSTRAINT "work_credits_role_id_credit_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."credit_roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_genres" ADD CONSTRAINT "work_genres_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_genres" ADD CONSTRAINT "work_genres_genre_id_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genres"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "edition_works_position_unique" ON "edition_works" USING btree ("edition_id","position");